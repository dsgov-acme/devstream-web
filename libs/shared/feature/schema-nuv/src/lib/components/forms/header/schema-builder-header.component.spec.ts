import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoggingService } from '@dsg/shared/utils/logging';
import { axe } from 'jest-axe';
import { MockProvider } from 'ng-mocks';
import { BuilderHeaderComponent } from './schema-builder-header.component';
describe('BuilderHeaderComponent', () => {
  let component: BuilderHeaderComponent;
  let fixture: ComponentFixture<BuilderHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuilderHeaderComponent, NoopAnimationsModule],
      providers: [MockProvider(LoggingService)],
    }).compileComponents();

    fixture = TestBed.createComponent(BuilderHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Accessibility', () => {
    it('should have no violations', async () => {
      const axeResults = await axe(fixture.nativeElement);
      expect(axeResults).toHaveNoViolations();
    });
  });
});
