import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ISchemaMetaData } from '@dsg/shared/data-access/work-api';
import { NuverialButtonComponent, NuverialIconComponent, NuverialSpinnerComponent } from '@dsg/shared/ui/nuverial';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialSpinnerComponent, NuverialIconComponent, NuverialButtonComponent],
  selector: 'dsg-schema-builder-header',
  standalone: true,
  styleUrls: ['./schema-builder-header.component.scss'],
  templateUrl: './schema-builder-header.component.html',
})
export class BuilderHeaderComponent {
  @Input() public metaData?: ISchemaMetaData | null;
  public loading = false;
}
