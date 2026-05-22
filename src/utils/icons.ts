// ---------------------------------------------------------------------------
// Mapa central de ícones Font Awesome usados na interface.
// Importar via `import { icons } from '@/utils/icons'` evita imports espalhados.
// ---------------------------------------------------------------------------
import {
  // Navegação
  faHouse,
  faTableCells,
  faBullseye,
  faTrophy,
  faGear,
  faFutbol,
  // Tema
  faSun,
  faMoon,
  // Calendário / status
  faCalendarDays,
  faCalendarDay,
  faClock,
  faClockRotateLeft,
  faLocationDot,
  faHourglassHalf,
  faCircleCheck,
  faCircleInfo,
  faTriangleExclamation,
  faSignal,
  faForwardStep,
  // Simulação
  faBolt,
  faDice,
  faRoute,
  faFire,
  faMedal,
  faSitemap,
  // Dados / ações
  faFileImport,
  faFileExport,
  faBroom,
  faRotateRight,
  faTrashCan,
  // Destaques
  faCrown,
  faAward,
  // Navegação contextual
  faChevronRight,
  faArrowRightLong,
  // PWA / instalação
  faMobileScreen,
  faDownload,
  // Outros
  faChartSimple,
  faMapLocationDot,
  faPaintbrush,
} from '@fortawesome/free-solid-svg-icons';

export const icons = {
  // navegação principal
  dashboard:  faHouse,
  matches:    faFutbol,
  groups:     faTableCells,
  round32:    faBullseye,
  bracket:    faTrophy,
  settings:   faGear,

  // tema
  light:      faSun,
  dark:       faMoon,

  // calendário / status
  calendar:   faCalendarDays,
  today:      faCalendarDay,
  clock:      faClock,
  past:       faClockRotateLeft,
  location:   faLocationDot,
  pending:    faHourglassHalf,
  qualified:  faCircleCheck,
  info:       faCircleInfo,
  warning:    faTriangleExclamation,
  done:       faCircleCheck,
  live:       faSignal,
  upcoming:   faForwardStep,

  // simulação
  simulation:        faBolt,
  dice:              faDice,
  simulateGroups:    faFutbol,
  simulateR32:       faBullseye,
  simulateR16:       faRoute,
  simulateQF:        faFire,
  simulateSemiFinal: faMedal,
  simulateAll:       faTrophy,

  // dados / ações
  import:     faFileImport,
  export:     faFileExport,
  clean:      faBroom,
  reset:      faRotateRight,
  trash:      faTrashCan,

  // destaques visuais
  champion:   faCrown,
  trophy:     faTrophy,
  thirdPlace: faMedal,
  award:      faAward,

  // navegação contextual
  chevronRight: faChevronRight,
  arrowRight:   faArrowRightLong,

  // PWA
  install:    faDownload,
  mobile:     faMobileScreen,

  // utilidades
  recent:     faChartSimple,
  howToUse:   faMapLocationDot,
  theme:      faPaintbrush,
  knockout:   faSitemap,
} as const;
