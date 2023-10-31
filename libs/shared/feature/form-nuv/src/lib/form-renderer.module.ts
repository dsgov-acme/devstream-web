import { NgModule } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { FormlyAddressComponent } from './components/advanced/address';
import { FormlyFileUploadComponent } from './components/advanced/file-upload';
import { FormlyFileUploaderComponent } from './components/advanced/file-upload/formly/file-uploader/file-uploader.component';
import { FormlyLogicValidatorComponent } from './components/advanced/logic-validator';
import { FormlyCheckboxComponent } from './components/checkbox';
import { FormlyCheckboxCardComponent } from './components/checkbox-card';
import { FormlyDatePickerComponent } from './components/date-picker';
import { FormlyDateRangePickerComponent } from './components/date-range-picker';
import { FormlySectionHeaderComponent } from './components/section-header';
import { FormlySelectComponent } from './components/select';
import { FormlySimpleChoiceQuestionsComponent } from './components/simple-choice-questions';
import { FormlyStepsComponent } from './components/steps';
import { FormlyTextAreaComponent } from './components/text-area';
import { FormlyTextContentComponent } from './components/text-content';
import { FormlyTextInputComponent } from './components/text-input';

@NgModule({
  declarations: [],
  imports: [
    FormlyMaterialModule,
    MatNativeDateModule,
    MatDialogModule,
    FormlyModule.forRoot({
      types: [
        { component: FormlyAddressComponent, name: 'nuverialAddress' },
        { component: FormlySimpleChoiceQuestionsComponent, name: 'nuverialRadioCards' },
        { component: FormlyCheckboxCardComponent, name: 'nuverialCheckboxCard' },
        { component: FormlyCheckboxComponent, name: 'nuverialCheckbox' },
        { component: FormlyDatePickerComponent, name: 'nuverialDatePicker' },
        { component: FormlyDateRangePickerComponent, name: 'nuverialDateRangePicker' },
        { component: FormlyFileUploadComponent, name: 'nuverialFileUpload' },
        { component: FormlyFileUploaderComponent, name: 'nuverialFileUploader' },
        { component: FormlySectionHeaderComponent, name: 'nuverialSectionHeader' },
        { component: FormlySelectComponent, name: 'nuverialSelect' },
        { component: FormlyStepsComponent, name: 'nuverialSteps' },
        { component: FormlyTextAreaComponent, name: 'nuverialTextArea' },
        { component: FormlyTextContentComponent, name: 'nuverialTextContent' },
        { component: FormlyTextInputComponent, name: 'nuverialTextInput' },
        { component: FormlyLogicValidatorComponent, name: 'nuverialLogicValidator' },
      ],
      validators: [{ name: 'email', validation: Validators.email }],
    }),
  ],
})
export class FormRendererModule {}
