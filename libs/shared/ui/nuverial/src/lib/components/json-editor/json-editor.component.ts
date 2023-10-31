import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { JsonEditorOptions, NgJsonEditorModule } from 'ang-jsoneditor';
/**
 * A JSON editor wrapper
 *
 * ## Usage
 *
 * ```
 * import { NuverialJsonEditorWrapperComponent } from '@dsg/shared/ui/nuverial';
 * <nuverial-json-editor-wrapper [formioJSONObject]="formioJSONObject"> </nuverial-json-editor-wrapper>
 * ```
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgJsonEditorModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  selector: 'nuverial-json-editor',
  standalone: true,
  styleUrls: ['./json-editor.component.scss'],
  templateUrl: './json-editor.component.html',
})
export class NuverialJsonEditorWrapperComponent {
  /**
   * Passes in a JSON object to be passed into the JSON editor to display
   */
  @Input() public formioJSONObject!: object;

  constructor() {
    this.initJsonEditorOptions();
  }
  public jsonEditorOptions!: JsonEditorOptions;
  public initJsonEditorOptions() {
    this.jsonEditorOptions = new JsonEditorOptions();
    this.jsonEditorOptions.mode = 'code';
    this.jsonEditorOptions.modes = ['code', 'text', 'tree', 'view'];
  }
}
