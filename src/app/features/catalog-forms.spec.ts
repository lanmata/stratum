import { ContactTypeService } from '@core/services/contact-type.service';
import { NoticeTypeService } from '@core/services/notice-type.service';
import { ServiceTypeService } from '@core/services/service-type.service';
import { describeCatalogForm } from '@app/testing/catalog-form';
import { ContactTypeFormComponent } from './contact-types/contact-type-form/contact-type-form.component';
import { NoticeTypeFormComponent } from './notice-types/notice-type-form/notice-type-form.component';
import { ServiceTypeFormComponent } from './service-types/service-type-form/service-type-form.component';

describeCatalogForm('ContactTypeFormComponent', {
  component: ContactTypeFormComponent,
  service: ContactTypeService,
  idParam: 'contactTypeId',
  listPath: '/contact-types',
  requestKey: 'contactType',
  messages: {
    created: 'Tipo de contacto creado',
    updated: 'Tipo de contacto actualizado',
    saveError: 'Error al guardar el tipo de contacto',
    loadError: 'Error al cargar el tipo de contacto',
  },
});

describeCatalogForm('NoticeTypeFormComponent', {
  component: NoticeTypeFormComponent,
  service: NoticeTypeService,
  idParam: 'noticeTypeId',
  listPath: '/notice-types',
  requestKey: 'noticeType',
  messages: {
    created: 'Tipo de aviso creado',
    updated: 'Tipo de aviso actualizado',
    saveError: 'Error al guardar el tipo de aviso',
    loadError: 'Error al cargar el tipo de aviso',
  },
});

describeCatalogForm('ServiceTypeFormComponent', {
  component: ServiceTypeFormComponent,
  service: ServiceTypeService,
  idParam: 'serviceTypeId',
  listPath: '/service-types',
  requestKey: 'serviceType',
  messages: {
    created: 'Tipo de servicio creado',
    updated: 'Tipo de servicio actualizado',
    saveError: 'Error al guardar el tipo de servicio',
    loadError: 'Error al cargar el tipo de servicio',
  },
});
