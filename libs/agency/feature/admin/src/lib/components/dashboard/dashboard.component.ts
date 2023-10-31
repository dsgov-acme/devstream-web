import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NuverialIconComponent } from '@dsg/shared/ui/nuverial';

interface DashboardCard {
  description: string;
  icon: string;
  route: string;
  tooltip?: string;
  title: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialIconComponent, RouterModule],
  selector: 'dsg-dashboard',
  standalone: true,
  styleUrls: ['./dashboard.component.scss'],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  public cards: DashboardCard[] = [
    {
      description: 'Create and configure transactions; including forms, selections rules and related workflows.',
      icon: 'filter_tilt_shift',
      route: 'transaction-definitions',
      title: 'Transaction Definitions',
      tooltip:
        'Transaction Definitions represent the main interaction point of the platform. These can be defined as different types of applications that are presented to public users for later adjudication by agents. Transaction definitions tie together a custom Workflow, a Schema and one or more Forms.',
    },
    {
      description: 'Create and maintain data elements used to define a transaction.',
      icon: 'schema',
      route: 'schemas',
      title: 'Schemas',
      tooltip:
        'Schemas represent how data is stored and interpreted by the platform. Schemas help define the type of each data element as well as to group elements into common data representations. Transaction are bound to a Schema to define the shape of the data for each Transaction.',
    },
    {
      description: 'Configure system-generated notifications and alerts to public users.',
      icon: 'notification_important',
      route: 'route-todo',
      title: 'Notifications',
      tooltip:
        'Notifications are used to communicate with public users on important workflow changes. These can be triggered when a transaction is submitted, approved, denied or when additional information is needed.',
    },
    {
      description: 'Find, view, and manage public user profiles.',
      icon: 'group',
      route: 'route-todo',
      title: 'Public Users',
    },
    {
      description: 'Find, view, and manage agency user profiles.',
      icon: 'shield_person',
      route: 'route-todo',
      title: 'Agency Users',
    },
    {
      description: 'Manage user roles and permissions.',
      icon: 'settings_account_box',
      route: 'route-todo',
      title: 'Roles',
    },
  ];

  public trackByFn(index: number): number {
    return index;
  }
}
