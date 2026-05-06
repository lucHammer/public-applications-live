const now = Date.now();
const hoursAgo = (hours) => now - hours * 60 * 60 * 1000;

const sampleApplications = [
  {
    created_at: hoursAgo(0.08),
    lat: 49.44054,
    lng: 8.575782,
    position_name: 'Servicetechniker (m/w/d) - Heidelberg',
    company_name: 'United Rentals GmbH'
  },
  {
    created_at: hoursAgo(0.25),
    lat: 52.45138,
    lng: 7.057214,
    position_name: 'Mitarbeiter in der Qualitaetssicherung (m/w/d)',
    company_name: 'Variotech GmbH'
  },
  {
    created_at: hoursAgo(0.7),
    lat: 49.475273,
    lng: 8.663787,
    position_name: 'Vertriebsmitarbeiter (m/w/d)',
    company_name: 'Hammerjobs'
  },
  {
    created_at: hoursAgo(1.2),
    lat: 52.004816,
    lng: 8.415139,
    position_name: 'Sales Manager (m/w/d)',
    company_name: 'Ambrosia FM Consulting & Services GmbH'
  },
  {
    created_at: hoursAgo(2.1),
    lat: 51.125829,
    lng: 13.580538,
    position_name: 'Kommissionierer (m/w/d)',
    company_name: 'WACHTEL ABT GmbH'
  },
  {
    created_at: hoursAgo(4.3),
    lat: 48.709368,
    lng: 9.463204,
    position_name: 'Servicetechniker (m/w/d) Stuttgart',
    company_name: 'MUGLER SE'
  },
  {
    created_at: hoursAgo(8.5),
    lat: 54.307966,
    lng: 13.028482,
    position_name: 'Fieldservice-Techniker fuer Mobilfunk und Festnetz (m/w/d) Rostock',
    company_name: 'MUGLER SE'
  },
  {
    created_at: hoursAgo(13.2),
    lat: 51.51305,
    lng: 7.423601,
    position_name: 'Servicetechniker (m/w/d)',
    company_name: 'MAE Maschinen- und Apparatebau Goetzen GmbH & Co.'
  },
  {
    created_at: hoursAgo(16.4),
    lat: 50.952401,
    lng: 6.913309,
    position_name: 'Elektroniker (m/w/d)',
    company_name: 'E-regio GmbH & Co. KG'
  },
  {
    created_at: hoursAgo(22.8),
    lat: 50.800212,
    lng: 12.709087,
    position_name: 'Projektleiter Mobilfunk (m/w/d)',
    company_name: 'MUGLER SE'
  }
];

export default {
  editor: {
    label: 'Public Applications Live',
    icon: 'activity'
  },
  options: {
    displayAllowedValues: ['block', 'flex']
  },
  properties: {
    applications: {
      label: { en: 'Applications' },
      type: 'json',
      bindable: true,
      defaultValue: sampleApplications
    },
    liveWindowHours: {
      label: { en: 'Live window hours' },
      type: 'Number',
      bindable: true,
      defaultValue: 12,
      options: { min: 0, max: 168, step: 1 }
    },
    minRevealDelay: {
      label: { en: 'Minimum reveal delay (ms)' },
      type: 'Number',
      bindable: true,
      defaultValue: 1000,
      options: { min: 0, max: 10000, step: 100 }
    },
    maxRevealDelay: {
      label: { en: 'Maximum reveal delay (ms)' },
      type: 'Number',
      bindable: true,
      defaultValue: 3000,
      options: { min: 0, max: 15000, step: 100 }
    },
    replayRecentOnLoad: {
      label: { en: 'Replay recent applications on load' },
      type: 'Boolean',
      defaultValue: true
    },
    backgroundColor: {
      label: { en: 'Background color' },
      type: 'Color',
      bindable: true,
      defaultValue: '#ffffff'
    },
    titleText: {
      label: { en: 'Title text' },
      type: 'Text',
      bindable: true,
      defaultValue: 'Bewerbungen nach Regionen'
    },
    titleColor: {
      label: { en: 'Title color' },
      type: 'Color',
      bindable: true,
      defaultValue: '#050505'
    },
    titleFontFamily: {
      label: { en: 'Title font family' },
      type: 'Text',
      bindable: true,
      defaultValue: 'inherit'
    },
    titleFontSize: {
      label: { en: 'Title font size' },
      type: 'Number',
      bindable: true,
      defaultValue: 32,
      options: { min: 10, max: 72, step: 1 }
    },
    titleFontWeight: {
      label: { en: 'Title font weight' },
      type: 'Number',
      bindable: true,
      defaultValue: 800,
      options: { min: 100, max: 1000, step: 100 }
    },
    titleLineHeight: {
      label: { en: 'Title line height' },
      type: 'Number',
      bindable: true,
      defaultValue: 1.08,
      options: { min: 0.8, max: 2, step: 0.01 }
    },
    titleLetterSpacing: {
      label: { en: 'Title letter spacing' },
      type: 'Number',
      bindable: true,
      defaultValue: 0,
      options: { min: -2, max: 8, step: 0.1 }
    },
    headerBottomSpacing: {
      label: { en: 'Header bottom spacing' },
      type: 'Number',
      bindable: true,
      defaultValue: 24,
      options: { min: 0, max: 96, step: 1 }
    },
    liveIndicatorText: {
      label: { en: 'Live indicator text' },
      type: 'Text',
      bindable: true,
      defaultValue: 'Live'
    },
    liveIndicatorDotColor: {
      label: { en: 'Live dot color' },
      type: 'Color',
      bindable: true,
      defaultValue: '#22c55e'
    },
    liveIndicatorTextColor: {
      label: { en: 'Live text color' },
      type: 'Color',
      bindable: true,
      defaultValue: '#050505'
    },
    liveIndicatorBackgroundColor: {
      label: { en: 'Live badge background' },
      type: 'Color',
      bindable: true,
      defaultValue: '#ffffff'
    },
    layoutGap: {
      label: { en: 'Layout gap' },
      type: 'Number',
      bindable: true,
      defaultValue: 28,
      options: { min: 0, max: 96, step: 1 }
    },
    mapMinHeight: {
      label: { en: 'Map minimum height' },
      type: 'Number',
      bindable: true,
      defaultValue: 420,
      options: { min: 240, max: 900, step: 10 }
    },
    mapFillColor: {
      label: { en: 'Map fill color' },
      type: 'Color',
      bindable: true,
      defaultValue: '#e7e7e7'
    },
    outlineColor: {
      label: { en: 'Outer outline color' },
      type: 'Color',
      bindable: true,
      defaultValue: '#111111'
    },
    regionLineColor: {
      label: { en: 'Region line color' },
      type: 'Color',
      bindable: true,
      defaultValue: '#6f6f6f'
    },
    hotspotColor: {
      label: { en: 'Hotspot color' },
      type: 'Color',
      bindable: true,
      defaultValue: '#2563ff'
    },
    glowOpacity: {
      label: { en: 'Glow opacity' },
      type: 'Number',
      bindable: true,
      defaultValue: 0.28,
      options: { min: 0, max: 1, step: 0.01 }
    },
    clusterRadius: {
      label: { en: 'Cluster radius' },
      type: 'Number',
      bindable: true,
      defaultValue: 34,
      options: { min: 5, max: 120, step: 1 }
    },
    minPointRadius: {
      label: { en: 'Minimum point radius' },
      type: 'Number',
      bindable: true,
      defaultValue: 5,
      options: { min: 2, max: 24, step: 1 }
    },
    maxPointRadius: {
      label: { en: 'Maximum point radius' },
      type: 'Number',
      bindable: true,
      defaultValue: 17,
      options: { min: 6, max: 40, step: 1 }
    },
    impactDuration: {
      label: { en: 'Map impact duration (ms)' },
      type: 'Number',
      bindable: true,
      defaultValue: 1700,
      options: { min: 500, max: 5000, step: 100 }
    },
    highlightColor: {
      label: { en: 'Live highlight color' },
      type: 'Color',
      bindable: true,
      defaultValue: '#dbeafe'
    },
    highlightDuration: {
      label: { en: 'Feed highlight duration (ms)' },
      type: 'Number',
      bindable: true,
      defaultValue: 1200,
      options: { min: 300, max: 5000, step: 100 }
    },
    sidePadding: {
      label: { en: 'Feed side padding' },
      type: 'Number',
      bindable: true,
      defaultValue: 18,
      options: { min: 0, max: 80, step: 1 }
    },
    highlightRadius: {
      label: { en: 'Feed highlight radius' },
      type: 'Number',
      bindable: true,
      defaultValue: 10,
      options: { min: 0, max: 32, step: 1 }
    },
    textColor: {
      label: { en: 'Text color' },
      type: 'Color',
      bindable: true,
      defaultValue: '#050505'
    },
    companyColor: {
      label: { en: 'Company color' },
      type: 'Color',
      bindable: true,
      defaultValue: '#050505'
    },
    timeColor: {
      label: { en: 'Time color' },
      type: 'Color',
      bindable: true,
      defaultValue: '#050505'
    },
    dividerColor: {
      label: { en: 'Divider color' },
      type: 'Color',
      bindable: true,
      defaultValue: '#e9e9e9'
    },
    rowPaddingY: {
      label: { en: 'Row vertical padding' },
      type: 'Number',
      bindable: true,
      defaultValue: 14,
      options: { min: 4, max: 48, step: 1 }
    },
    positionFontSize: {
      label: { en: 'Position font size' },
      type: 'Number',
      bindable: true,
      defaultValue: 21,
      options: { min: 12, max: 48, step: 1 }
    },
    companyFontSize: {
      label: { en: 'Company font size' },
      type: 'Number',
      bindable: true,
      defaultValue: 19,
      options: { min: 12, max: 40, step: 1 }
    },
    timeFontSize: {
      label: { en: 'Time font size' },
      type: 'Number',
      bindable: true,
      defaultValue: 17,
      options: { min: 10, max: 34, step: 1 }
    }
  }
};
