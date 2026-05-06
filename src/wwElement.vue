<template>
  <div class="ww-applications-live" :style="rootStyle">
    <div class="applications-live-header">
      <div class="applications-live-title">{{ titleText }}</div>
      <div class="applications-live-status" aria-label="Live-Status">
        <span class="applications-live-status-dot" aria-hidden="true"></span>
        <span class="applications-live-status-text">{{ liveIndicatorText }}</span>
      </div>
    </div>

    <div class="applications-live-layout">
      <div class="applications-live-map" aria-label="Deutschlandkarte mit Live-Bewerbungen">
        <svg
          class="applications-live-map-svg"
          :viewBox="germanyMap.viewBox"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Deutschlandkarte mit Bewerbungs-Hotspots"
        >
          <defs>
            <filter id="applications-live-hotspot-glow" x="-220%" y="-220%" width="540%" height="540%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g class="applications-live-map-outline" aria-hidden="true">
            <path
              v-for="location in germanyMap.locations"
              :key="`outline-${location.id}`"
              :d="location.path"
              class="applications-live-map-outline-path"
            />
          </g>

          <g class="applications-live-map-regions">
            <path
              v-for="location in germanyMap.locations"
              :key="location.id"
              :d="location.path"
              class="applications-live-map-region"
            />
          </g>

          <g class="applications-live-map-hotspots">
            <g
              v-for="hotspot in hotspots"
              :key="hotspot.id"
              class="applications-live-map-hotspot"
              :class="{ fresh: hotspot.isFresh }"
              :transform="`translate(${hotspot.x} ${hotspot.y})`"
              :style="{ color: hotspot.color }"
              :tabindex="isEditing ? -1 : 0"
              :role="isEditing ? 'presentation' : 'button'"
              @click="emitHotspotClick(hotspot)"
              @keydown.enter.prevent="emitHotspotClick(hotspot)"
              @keydown.space.prevent="emitHotspotClick(hotspot)"
            >
              <title>{{ hotspot.tooltip }}</title>
              <circle
                class="applications-live-map-hotspot-glow"
                :r="hotspot.glowRadius"
                :fill="hotspot.color"
                :opacity="hotspot.glowOpacity"
              />
              <circle
                class="applications-live-map-hotspot-ambient-pulse"
                :r="hotspot.ambientPulseRadius"
                :stroke="hotspot.color"
                :style="{ animationDelay: hotspot.pulseDelay }"
              />
              <circle
                class="applications-live-map-hotspot-halo"
                :r="hotspot.haloRadius"
                :stroke="hotspot.color"
                :opacity="hotspot.haloOpacity"
              />
              <circle
                class="applications-live-map-hotspot-core"
                :r="hotspot.coreRadius"
                :fill="hotspot.color"
                :stroke="hotspot.strokeColor"
              />
              <circle
                class="applications-live-map-hotspot-light"
                :r="Math.max(2, hotspot.coreRadius * 0.34)"
              />
              <circle
                v-if="hotspot.isFresh"
                class="applications-live-map-hotspot-impact-ring hotspot-impact-ring-one"
                :r="hotspot.impactRadius"
                :stroke="hotspot.color"
              />
              <circle
                v-if="hotspot.isFresh"
                class="applications-live-map-hotspot-impact-ring hotspot-impact-ring-two"
                :r="hotspot.impactRadius"
                :stroke="hotspot.color"
              />
            </g>
          </g>
        </svg>
      </div>

      <div class="applications-live-feed-panel">
        <div class="applications-live-feed">
          <TransitionGroup name="application-row" tag="div" class="applications-feed-list">
            <article
              v-for="application in visibleApplications"
              :key="application.id"
              class="application-row"
              :class="{ fresh: application.isFresh }"
            >
              <div class="application-copy">
                <div class="application-position">{{ application.title }}</div>
                <div class="application-company">{{ application.company }}</div>
              </div>
              <time class="application-time" :datetime="application.isoDate">
                {{ application.relativeTime }}
              </time>
            </article>
          </TransitionGroup>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import germanyMap from './germanyMap';

const HOUR_IN_MS = 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;
const MAP_WIDTH = 586;
const MAP_HEIGHT = 793;
const GEO_BOUNDS = {
  minLat: 47.12,
  maxLat: 55.2,
  minLng: 5.0,
  maxLng: 15.55
};

function numberOrFallback(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sanitizeTimestamp(value) {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}

function formatRelativeTime(timestamp, now) {
  const diff = Math.max(0, now - timestamp);
  const minutes = Math.floor(diff / MINUTE_IN_MS);

  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return `vor ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours}h`;

  const days = Math.floor(hours / 24);
  return `vor ${days}d`;
}

function projectToGermanySvg(lat, lng) {
  const normalizedX = (lng - GEO_BOUNDS.minLng) / (GEO_BOUNDS.maxLng - GEO_BOUNDS.minLng);
  const normalizedY = (GEO_BOUNDS.maxLat - lat) / (GEO_BOUNDS.maxLat - GEO_BOUNDS.minLat);

  return {
    x: clamp(normalizedX * MAP_WIDTH, 0, MAP_WIDTH),
    y: clamp(normalizedY * MAP_HEIGHT, 0, MAP_HEIGHT)
  };
}

function isValidApplicationLocation(application) {
  const lat = Number(application?.lat);
  const lng = Number(application?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;

  return (
    lat >= GEO_BOUNDS.minLat &&
    lat <= GEO_BOUNDS.maxLat &&
    lng >= GEO_BOUNDS.minLng &&
    lng <= GEO_BOUNDS.maxLng
  );
}

function normalizeApplication(application, index) {
  const timestamp = sanitizeTimestamp(application?.created_at);
  if (!timestamp) return null;

  return {
    id: `${timestamp}-${index}-${application?.position_name || ''}-${application?.company_name || ''}`,
    timestamp,
    lat: Number(application?.lat),
    lng: Number(application?.lng),
    title: `Bewerbung als ${application?.position_name || 'Unbekannte Position'}`,
    company: application?.company_name || 'Unbekanntes Unternehmen',
    position_name: application?.position_name,
    company_name: application?.company_name,
    isoDate: new Date(timestamp).toISOString(),
    raw: application,
    isFresh: false
  };
}

function formatTooltip(cluster) {
  const positions = [...new Set(cluster.items.map((item) => item.position_name).filter(Boolean))].slice(0, 4);
  const companies = [...new Set(cluster.items.map((item) => item.company_name).filter(Boolean))].slice(0, 3);
  const positionText = positions.length ? `\n${positions.join('\n')}` : '';
  const companyText = companies.length ? `\n${companies.join(', ')}` : '';

  return `${cluster.count} Bewerbung${cluster.count === 1 ? '' : 'en'}${companyText}${positionText}`;
}

export default {
  name: 'PublicApplicationsLive',
  props: {
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
    content: { type: Object, required: true }
  },
  emits: ['trigger-event'],
  setup(props, { emit }) {
    const content = computed(() => props.content || {});
    const now = ref(Date.now());
    const visibleIds = ref(new Set());
    const freshIds = ref(new Set());
    const impactIds = ref(new Set());
    const timers = [];

    const liveWindowHours = computed(() => Math.max(0, numberOrFallback(content.value.liveWindowHours, 12)));
    const minRevealDelay = computed(() => Math.max(0, numberOrFallback(content.value.minRevealDelay, 1000)));
    const maxRevealDelay = computed(() => Math.max(minRevealDelay.value, numberOrFallback(content.value.maxRevealDelay, 3000)));
    const replayRecentOnLoad = computed(() => content.value.replayRecentOnLoad !== false);
    const highlightDuration = computed(() => Math.max(300, numberOrFallback(content.value.highlightDuration, 1200)));
    const impactDuration = computed(() => Math.max(500, numberOrFallback(content.value.impactDuration, 1700)));
    const liveIndicatorText = computed(() => content.value.liveIndicatorText || 'Live');
    const titleText = computed(() => content.value.titleText ?? 'Bewerbungen nach Regionen');

    const clusterRadius = computed(() => numberOrFallback(content.value.clusterRadius, 34));
    const minPointRadius = computed(() => numberOrFallback(content.value.minPointRadius, 5));
    const maxPointRadius = computed(() => numberOrFallback(content.value.maxPointRadius, 17));
    const glowOpacityValue = computed(() => clamp(numberOrFallback(content.value.glowOpacity, 0.28), 0, 1));

    const applications = computed(() => {
      const source = Array.isArray(content.value.applications) ? content.value.applications : [];
      return source
        .map(normalizeApplication)
        .filter(Boolean)
        .sort((a, b) => b.timestamp - a.timestamp);
    });

    const visibleApplicationItems = computed(() => applications.value
      .filter((application) => visibleIds.value.has(application.id)));

    const visibleApplications = computed(() => visibleApplicationItems.value
      .map((application) => ({
        ...application,
        isFresh: freshIds.value.has(application.id),
        relativeTime: formatRelativeTime(application.timestamp, now.value)
      })));

    const visibleMapApplications = computed(() => visibleApplicationItems.value
      .filter(isValidApplicationLocation));

    const hotspots = computed(() => {
      const clusters = [];
      const radius = Math.max(1, clusterRadius.value);

      visibleMapApplications.value.forEach((application) => {
        const point = projectToGermanySvg(application.lat, application.lng);

        let nearestCluster = null;
        let nearestDistance = Infinity;

        clusters.forEach((cluster) => {
          const dx = point.x - cluster.x;
          const dy = point.y - cluster.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestCluster = cluster;
          }
        });

        if (nearestCluster && nearestDistance <= radius) {
          const nextCount = nearestCluster.count + 1;
          nearestCluster.x = (nearestCluster.x * nearestCluster.count + point.x) / nextCount;
          nearestCluster.y = (nearestCluster.y * nearestCluster.count + point.y) / nextCount;
          nearestCluster.lat = (nearestCluster.lat * nearestCluster.count + application.lat) / nextCount;
          nearestCluster.lng = (nearestCluster.lng * nearestCluster.count + application.lng) / nextCount;
          nearestCluster.count = nextCount;
          nearestCluster.items.push(application);
          nearestCluster.isFresh = nearestCluster.isFresh || impactIds.value.has(application.id);
        } else {
          clusters.push({
            id: `hotspot-${application.id}`,
            x: point.x,
            y: point.y,
            lat: application.lat,
            lng: application.lng,
            count: 1,
            items: [application],
            isFresh: impactIds.value.has(application.id)
          });
        }
      });

      const minRadius = Math.max(1, minPointRadius.value);
      const maxRadius = Math.max(minRadius, maxPointRadius.value);

      return clusters.map((cluster) => {
        const strength = clamp(Math.log2(cluster.count) / Math.log2(8), 0, 1);
        const haloRadius = minRadius * 2.05 + strength * (maxRadius * 1.42 - minRadius * 2.05);
        const coreRadius = 5.1 + strength * 2.15;
        const pulseDelay = `${(((cluster.x * 13 + cluster.y * 7) % 1800) / 1000).toFixed(2)}s`;
        const baseColor = content.value.hotspotColor || '#2563ff';
        const highlightColor = content.value.highlightColor || '#dbeafe';
        const activeColor = cluster.isFresh ? highlightColor : baseColor;

        return {
          ...cluster,
          coreRadius,
          haloRadius,
          glowRadius: haloRadius * (1.28 + strength * 0.08),
          ambientPulseRadius: Math.max(coreRadius + 1.5, haloRadius * 0.56),
          impactRadius: Math.max(8, haloRadius * 0.66),
          color: activeColor,
          strokeColor: activeColor,
          pulseDelay,
          glowOpacity: clamp(glowOpacityValue.value * (0.9 + strength * 0.42), 0.17, 0.48),
          haloOpacity: clamp(0.18 + strength * 0.1, 0.18, 0.28),
          tooltip: formatTooltip(cluster)
        };
      });
    });

    const rootStyle = computed(() => ({
      '--applications-live-background': content.value.backgroundColor || '#ffffff',
      '--applications-live-gap': `${numberOrFallback(content.value.layoutGap, 28)}px`,
      '--applications-live-header-gap': `${numberOrFallback(
        content.value.headerBottomSpacing ?? content.value.headerGap,
        24
      )}px`,
      '--applications-live-map-min-height': `${numberOrFallback(content.value.mapMinHeight, 420)}px`,
      '--applications-live-map-fill': content.value.mapFillColor || '#e7e7e7',
      '--applications-live-outline': content.value.outlineColor || '#111111',
      '--applications-live-region-line': content.value.regionLineColor || '#6f6f6f',
      '--applications-live-hotspot': content.value.hotspotColor || '#2563ff',
      '--applications-live-title-color': content.value.titleColor || '#050505',
      '--applications-live-title-size': `${numberOrFallback(content.value.titleFontSize, 32)}px`,
      '--applications-live-title-weight': numberOrFallback(content.value.titleFontWeight, 800),
      '--applications-live-title-line-height': numberOrFallback(content.value.titleLineHeight, 1.08),
      '--applications-live-title-letter-spacing': `${numberOrFallback(content.value.titleLetterSpacing, 0)}px`,
      '--applications-live-title-font-family': content.value.titleFontFamily || 'inherit',
      '--applications-live-dot': content.value.liveIndicatorDotColor || '#22c55e',
      '--applications-live-status-text': content.value.liveIndicatorTextColor || '#050505',
      '--applications-live-status-background': content.value.liveIndicatorBackgroundColor || '#ffffff',
      '--applications-feed-highlight': content.value.highlightColor || '#dbeafe',
      '--applications-feed-text': content.value.textColor || '#050505',
      '--applications-feed-company': content.value.companyColor || '#050505',
      '--applications-feed-time': content.value.timeColor || '#050505',
      '--applications-feed-divider': content.value.dividerColor || '#e9e9e9',
      '--applications-feed-side-padding': `${numberOrFallback(content.value.sidePadding, 18)}px`,
      '--applications-feed-highlight-radius': `${numberOrFallback(content.value.highlightRadius, 10)}px`,
      '--applications-feed-row-padding-y': `${numberOrFallback(content.value.rowPaddingY, 14)}px`,
      '--applications-feed-position-size': `${numberOrFallback(content.value.positionFontSize, 24)}px`,
      '--applications-feed-company-size': `${numberOrFallback(content.value.companyFontSize, 22)}px`,
      '--applications-feed-time-size': `${numberOrFallback(content.value.timeFontSize, 20)}px`
    }));

    const isEditing = computed(() => {
      /* wwEditor:start */
      if (!props.wwEditorState || typeof wwLib === 'undefined') return false;
      return props.wwEditorState.editMode === wwLib.wwEditorHelper.EDIT_MODES.EDITION;
      /* wwEditor:end */
      return false;
    });

    function clearTimers() {
      while (timers.length) {
        clearTimeout(timers.pop());
      }
    }

    function setVisible(nextIds) {
      visibleIds.value = new Set(nextIds);
    }

    function markFresh(application) {
      freshIds.value = new Set([...freshIds.value, application.id]);
      impactIds.value = new Set([...impactIds.value, application.id]);

      const freshTimer = setTimeout(() => {
        const nextFreshIds = new Set(freshIds.value);
        nextFreshIds.delete(application.id);
        freshIds.value = nextFreshIds;
      }, highlightDuration.value);

      const impactTimer = setTimeout(() => {
        const nextImpactIds = new Set(impactIds.value);
        nextImpactIds.delete(application.id);
        impactIds.value = nextImpactIds;
      }, impactDuration.value);

      timers.push(freshTimer, impactTimer);
    }

    function revealApplication(application) {
      if (visibleIds.value.has(application.id)) return;

      setVisible([application.id, ...visibleIds.value]);
      markFresh(application);

      emit('trigger-event', {
        name: 'application:reveal',
        event: application.raw
      });
    }

    function randomDelay() {
      const min = minRevealDelay.value;
      const max = maxRevealDelay.value;
      return min + Math.random() * (max - min);
    }

    function initializeLiveReplay() {
      clearTimers();
      freshIds.value = new Set();
      impactIds.value = new Set();

      const cutoff = now.value - liveWindowHours.value * HOUR_IN_MS;
      const recent = applications.value.filter((application) => application.timestamp >= cutoff);
      const initial = replayRecentOnLoad.value
        ? applications.value.filter((application) => application.timestamp < cutoff)
        : applications.value;

      setVisible(initial.map((application) => application.id));

      if (!replayRecentOnLoad.value) return;

      let accumulatedDelay = 0;
      [...recent].reverse().forEach((application) => {
        accumulatedDelay += randomDelay();
        const timer = setTimeout(() => revealApplication(application), accumulatedDelay);
        timers.push(timer);
      });
    }

    function emitHotspotClick(hotspot) {
      if (isEditing.value) return;

      emit('trigger-event', {
        name: 'hotspot:click',
        event: {
          count: hotspot.count,
          lat: hotspot.lat,
          lng: hotspot.lng,
          applications: hotspot.items.map((item) => item.raw)
        }
      });
    }

    let clockInterval = null;

    onMounted(() => {
      initializeLiveReplay();
      clockInterval = setInterval(() => {
        now.value = Date.now();
      }, MINUTE_IN_MS);
    });

    onUnmounted(() => {
      clearTimers();
      if (clockInterval) clearInterval(clockInterval);
    });

    watch(
      () => [
        applications.value.map((application) => application.id).join('|'),
        liveWindowHours.value,
        minRevealDelay.value,
        maxRevealDelay.value,
        replayRecentOnLoad.value,
        highlightDuration.value,
        impactDuration.value
      ],
      initializeLiveReplay
    );

    return {
      germanyMap,
      hotspots,
      visibleApplications,
      liveIndicatorText,
      titleText,
      rootStyle,
      isEditing,
      emitHotspotClick
    };
  }
};
</script>

<style lang="scss" scoped>
.ww-applications-live {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  row-gap: var(--applications-live-header-gap);
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  background: var(--applications-live-background);
  color: var(--applications-feed-text);
  font-family: inherit;
}

.applications-live-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 16px;
  width: 100%;
  min-width: 0;
}

.applications-live-title {
  min-width: 0;
  color: var(--applications-live-title-color);
  font-family: var(--applications-live-title-font-family);
  font-size: var(--applications-live-title-size);
  font-weight: var(--applications-live-title-weight);
  line-height: var(--applications-live-title-line-height);
  letter-spacing: var(--applications-live-title-letter-spacing);
}

.applications-live-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  gap: var(--applications-live-gap);
  width: 100%;
  min-height: 0;
  overflow: hidden;
}

.applications-live-map,
.applications-live-feed-panel {
  min-width: 0;
  min-height: 0;
}

.applications-live-map {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 0;
  overflow: visible;
}

.applications-live-map-svg {
  display: block;
  width: min(100%, 640px);
  height: 100%;
  min-height: 0;
  max-height: 100%;
  overflow: visible;
}

.applications-live-map-outline,
.applications-live-map-regions {
  filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.58));
}

.applications-live-map-outline-path {
  fill: none;
  stroke: var(--applications-live-outline);
  stroke-width: 1.85;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.applications-live-map-region {
  fill: var(--applications-live-map-fill);
  stroke: var(--applications-live-region-line);
  stroke-width: 0.55;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.applications-live-map-hotspot {
  cursor: pointer;
  outline: none;

  &:focus-visible .applications-live-map-hotspot-core {
    stroke-width: 2.4;
  }
}

.applications-live-map-hotspot-glow {
  filter: url('#applications-live-hotspot-glow');
}

.applications-live-map-hotspot-core {
  stroke-width: 2;
  filter: drop-shadow(0 0 7px currentColor);
  transform-box: fill-box;
  transform-origin: center;
}

.applications-live-map-hotspot-ambient-pulse {
  fill: none;
  stroke-width: 1.25;
  opacity: 0;
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
  animation: applications-live-ambient-pulse 3.1s ease-out infinite;
}

.applications-live-map-hotspot-halo {
  fill: currentColor;
  fill-opacity: 0.1;
  stroke-width: 2;
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
}

.applications-live-map-hotspot-light {
  fill: rgba(255, 255, 255, 0.5);
  pointer-events: none;
}

.applications-live-map-hotspot.fresh .applications-live-map-hotspot-core {
  animation: applications-live-core-pop 780ms ease-out;
}

.applications-live-map-hotspot.fresh .applications-live-map-hotspot-halo {
  animation: applications-live-halo-hit 980ms ease-out;
}

.applications-live-map-hotspot-impact-ring {
  fill: none;
  stroke-width: 2.3;
  opacity: 0;
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
}

.hotspot-impact-ring-one {
  animation: applications-live-impact-ring 1500ms ease-out forwards;
}

.hotspot-impact-ring-two {
  animation: applications-live-impact-ring 1700ms ease-out 160ms forwards;
}

.applications-live-feed-panel {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
}

.applications-live-status {
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--applications-live-status-background);
  color: var(--applications-live-status-text);
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
}

.applications-live-status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--applications-live-dot);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--applications-live-dot) 16%, transparent);
  animation: applications-live-status-pulse 1.8s ease-out infinite;
}

.applications-live-status-text {
  display: block;
}

.applications-live-feed {
  min-height: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.applications-feed-list {
  min-height: 100%;
}

.application-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 24px;
  align-items: center;
  position: relative;
  background: var(--applications-live-background);
  padding: var(--applications-feed-row-padding-y) calc(var(--applications-feed-side-padding) + 14px);
  isolation: isolate;
  transition:
    transform 420ms ease,
    opacity 420ms ease;

  &::before {
    content: '';
    position: absolute;
    inset: 6px var(--applications-feed-side-padding);
    z-index: -1;
    border-radius: var(--applications-feed-highlight-radius);
    background: transparent;
    box-shadow: none;
    opacity: 0;
    transform: scaleX(0.985);
    transition:
      opacity 520ms ease,
      background-color 520ms ease,
      box-shadow 520ms ease,
      transform 520ms ease;
  }

  &::after {
    content: '';
    position: absolute;
    right: var(--applications-feed-side-padding);
    bottom: 0;
    left: var(--applications-feed-side-padding);
    height: 1px;
    background: var(--applications-feed-divider);
  }
}

.application-row.fresh::before {
  animation: application-highlight-pulse 900ms ease-out;
  background: var(--applications-feed-highlight);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--applications-feed-highlight) 18%, transparent),
    0 8px 24px color-mix(in srgb, var(--applications-feed-highlight) 38%, transparent);
  opacity: 1;
  transform: scaleX(1);
}

.application-row.fresh {
  z-index: 2;
}

.application-copy {
  min-width: 0;
}

.application-position {
  color: var(--applications-feed-text);
  font-size: var(--applications-feed-position-size);
  font-weight: 400;
  line-height: 1.22;
  letter-spacing: 0;
}

.application-company {
  margin-top: 14px;
  color: var(--applications-feed-company);
  font-size: var(--applications-feed-company-size);
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: 0;
}

.application-time {
  color: var(--applications-feed-time);
  font-size: var(--applications-feed-time-size);
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.application-row-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.99);
}

.application-row-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.application-row-move {
  transition: transform 420ms ease;
}

@keyframes applications-live-core-pop {
  0% {
    transform: scale(0.78);
  }

  42% {
    transform: scale(1.18);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes applications-live-ambient-pulse {
  0% {
    opacity: 0.24;
    transform: scale(0.76);
    stroke-width: 1.35;
  }

  72%,
  100% {
    opacity: 0;
    transform: scale(1.82);
    stroke-width: 0.7;
  }
}

@keyframes applications-live-halo-hit {
  0% {
    opacity: 0.7;
    transform: scale(0.82);
  }

  45% {
    opacity: 0.42;
    transform: scale(1.08);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes applications-live-impact-ring {
  0% {
    opacity: 0.68;
    transform: scale(0.38);
    stroke-width: 3;
  }

  72%,
  100% {
    opacity: 0;
    transform: scale(2.45);
    stroke-width: 0.8;
  }
}

@keyframes application-highlight-pulse {
  0% {
    opacity: 0;
    transform: scaleX(0.96);
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--applications-feed-highlight) 0%, transparent);
  }

  24% {
    opacity: 1;
    transform: scaleX(1);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--applications-feed-highlight) 22%, transparent),
      0 10px 30px color-mix(in srgb, var(--applications-feed-highlight) 48%, transparent);
  }

  100% {
    opacity: 1;
    transform: scaleX(1);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--applications-feed-highlight) 18%, transparent),
      0 8px 24px color-mix(in srgb, var(--applications-feed-highlight) 38%, transparent);
  }
}

@keyframes applications-live-status-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--applications-live-dot) 30%, transparent);
  }

  70%,
  100% {
    box-shadow: 0 0 0 7px color-mix(in srgb, var(--applications-live-dot) 0%, transparent);
  }
}

@media (max-width: 560px) {
  .applications-live-layout {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 0.48fr) minmax(0, 0.52fr);
  }

  .applications-live-map {
    min-height: 0;
  }

  .applications-live-feed-panel {
    min-height: 0;
  }
}

@media (max-width: 640px) {
  .application-row {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 10px;
  }

  .application-time {
    justify-self: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .application-row,
  .application-row-move,
  .applications-live-map-hotspot-ambient-pulse,
  .applications-live-map-hotspot.fresh .applications-live-map-hotspot-core,
  .applications-live-map-hotspot.fresh .applications-live-map-hotspot-halo,
  .applications-live-map-hotspot-impact-ring {
    animation: none;
    transition: none;
  }
}
</style>
