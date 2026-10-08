import type { IconName } from '@shared/components/icon/icon.component';

export interface NavItem {
  path: string;
  label: string;
  description: string;
  icon: IconName;
  accent: string;
}

export interface NavGroup {
  name: string;
  items: NavItem[];
}

export interface QuickAction {
  path: string;
  label: string;
  icon: IconName;
}

export const DASHBOARD_ITEM: NavItem = {
  path: '/dashboard',
  label: 'Inicio',
  description: 'Resumen general del backoffice',
  icon: 'home',
  accent: 'from-slate-500 to-slate-700',
};

export const NAV_GROUPS: NavGroup[] = [
  {
    name: 'Gestión',
    items: [
      {
        path: '/applications',
        label: 'Aplicaciones',
        description: 'Aplicaciones, sus usuarios, roles y las features de cada rol',
        icon: 'apps',
        accent: 'from-blue-500 to-indigo-600',
      },
      {
        path: '/people',
        label: 'Personas',
        description: 'Personas, contactos, direcciones y documentos de identificación',
        icon: 'users',
        accent: 'from-emerald-500 to-teal-600',
      },
      {
        path: '/contacts',
        label: 'Contactos',
        description: 'Directorio de contactos de todas las personas',
        icon: 'phone',
        accent: 'from-lime-500 to-green-600',
      },
      {
        path: '/features',
        label: 'Features',
        description: 'Funcionalidades asignables a los roles',
        icon: 'puzzle',
        accent: 'from-fuchsia-500 to-pink-600',
      },
      {
        path: '/audit',
        label: 'Auditoría',
        description: 'Registro de eventos del sistema',
        icon: 'audit',
        accent: 'from-amber-500 to-orange-600',
      },
    ],
  },
  {
    name: 'Catálogos',
    items: [
      {
        path: '/contact-types',
        label: 'Tipos de Contacto',
        description: 'Catálogo de tipos de contacto',
        icon: 'tag',
        accent: 'from-violet-500 to-purple-600',
      },
      {
        path: '/service-types',
        label: 'Tipos de Servicio',
        description: 'Catálogo de tipos de servicio',
        icon: 'cog',
        accent: 'from-sky-500 to-cyan-600',
      },
      {
        path: '/notice-types',
        label: 'Tipos de Aviso',
        description: 'Catálogo de tipos de aviso',
        icon: 'megaphone',
        accent: 'from-rose-500 to-pink-600',
      },
    ],
  },
  {
    name: 'Herramientas',
    items: [
      {
        path: '/iam',
        label: 'Herramientas IAM',
        description: 'Introspección de tokens y verificación de permisos',
        icon: 'shield',
        accent: 'from-slate-600 to-gray-800',
      },
      {
        path: '/reports',
        label: 'Reportes',
        description: 'Genera documentos Word desde plantillas',
        icon: 'document',
        accent: 'from-teal-500 to-cyan-700',
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = [DASHBOARD_ITEM, ...NAV_GROUPS.flatMap((g) => g.items)];

export const QUICK_ACTIONS: QuickAction[] = [
  { path: '/applications/new', label: 'Nueva aplicación', icon: 'plus' },
  { path: '/people/new', label: 'Nueva persona', icon: 'plus' },
  { path: '/contact-types/new', label: 'Nuevo tipo de contacto', icon: 'plus' },
  { path: '/service-types/new', label: 'Nuevo tipo de servicio', icon: 'plus' },
  { path: '/notice-types/new', label: 'Nuevo tipo de aviso', icon: 'plus' },
];
