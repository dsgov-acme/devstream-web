import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { LoggingService } from '@dsg/shared/utils/logging';
import { render } from '@testing-library/angular';
import { MockBuilder, MockService } from 'ng-mocks';
import { INuverialNavBarMenuItem } from '../../models';
import { NuverialSideNavMenuComponent } from './side-nav-menu.component';

const dependencies = MockBuilder(NuverialSideNavMenuComponent).keep(MatSidenavModule).keep(MatListModule).keep(CommonModule).build();

const NAV_BAR_MENU_OPTIONS: INuverialNavBarMenuItem[] = [
  {
    icon: 'language',
    navigationRoute: 'dashboard',
  },
  {
    icon: 'gpp_maybe',
    navigationRoute: 'home',
  },
  {
    icon: 'space_dashboard',
    navigationRoute: 'list',
  },
];

const getFixture = async (props: Record<string, Record<string, unknown>>) => {
  const { fixture } = await render(NuverialSideNavMenuComponent, {
    ...dependencies,
    ...props,
    providers: [{ provide: LoggingService, useValue: MockService(LoggingService) }],
  });

  return { fixture };
};

describe('NuverialSideNavMenuComponent', () => {
  it('should create', async () => {
    const { fixture } = await getFixture({});
    expect(fixture).toBeTruthy();
  });

  it('can define a default side nav menu component', async () => {
    const { fixture } = await getFixture({});

    expect(fixture).toBeTruthy();
    expect(fixture.componentInstance.navBarMenuItemList).toEqual(undefined);
    expect(fixture.componentInstance.navBarMenuBottomItem).toEqual(undefined);
  });

  it('should set navBarMenuItemList', async () => {
    const { fixture } = await getFixture({ componentProperties: { navBarMenuItemList: NAV_BAR_MENU_OPTIONS } });

    fixture.detectChanges();
    expect(NAV_BAR_MENU_OPTIONS.length).toEqual(fixture.componentInstance.navBarMenuItemList?.length);
  });

  it('should default to mat menu having no elements', async () => {
    const { fixture } = await getFixture({});
    const menu: HTMLElement = fixture.debugElement.nativeElement.querySelector('mat-sidenav');
    const menuElements = menu.querySelectorAll('mat-list-item').length;
    expect(menuElements).toEqual(0);
  });

  it('should render the appropriate amount of mat sidenav menu elements', async () => {
    const { fixture } = await getFixture({ componentProperties: { navBarMenuItemList: NAV_BAR_MENU_OPTIONS } });
    const sidenav: HTMLElement = fixture.debugElement.nativeElement.querySelector('mat-sidenav');
    fixture.detectChanges();

    const sidenavElements = sidenav.querySelectorAll('mat-list-item').length;
    expect(sidenavElements).toEqual(3);
  });
});
