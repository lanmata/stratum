import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { LoadingService } from '@core/services/loading.service';
import { SessionKeepAliveService } from '@core/services/session-keepalive.service';

describe('App', () => {
  let keepAlive: jasmine.SpyObj<SessionKeepAliveService>;

  beforeEach(async () => {
    keepAlive = jasmine.createSpyObj('SessionKeepAliveService', ['start']);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: SessionKeepAliveService, useValue: keepAlive }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the router outlet and toast host', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
    expect(compiled.querySelector('app-toast')).not.toBeNull();
  });

  it('initialises the theme and starts the session keep-alive', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(keepAlive.start).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('theme')).not.toBeNull();
  });

  it('shows the loading bar while requests are in flight', () => {
    const fixture = TestBed.createComponent(App);
    const loading = TestBed.inject(LoadingService);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=progressbar]')).toBeNull();
    loading.start();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=progressbar]')).not.toBeNull();
    loading.stop();
  });
});
