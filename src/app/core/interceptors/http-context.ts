import { HttpContextToken } from '@angular/common/http';

export const SILENT_ERRORS = new HttpContextToken<boolean>(() => false);
