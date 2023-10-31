import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, forwardRef, Inject, Injector, Input, Output } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { LoggingService } from '@dsg/shared/utils/logging';
import { FormInputBaseDirective } from '../../common';
import { CardChange, CardTypes, NuverialCardCommonComponent } from '../../directives';
import { NuverialCardGroupComponent } from '../card-group/card-group.component';
import { NuverialIconComponent } from '../icon';
import { NuverialRadioCardComponent } from '../radio-card/radio-card.component';
import { INuverialRadioCard } from './radio-cards.model';

/**
 * Cards is a component that groups radioCards or checkCards components, to facilitate their inclusion in forms and to unify values
 *
 * ## Usage
 *
 * ```
 * import { NuverialRadioCardsComponent, INuverialRadioCard } from '@dsg/shared/ui/nuverial';
 *
 * public radioCards: INuverialRadioCard[] = [
    {
      imageAltLabel: 'imageAltLabel',
      imagePath: '/assets/images/child-performer.jpg',
      imagePosition: 'before',
      title: 'Yes',
      value: 'yes',
    },
    {
      imageAltLabel: 'imageAltLabel',
      imagePath: '/assets/images/child-performer.jpg',
      imagePosition: 'top',
      title: 'No',
      value: 'no',
    },
    {
      title: 'Maybe',
      value: 'maybe',
    },
  ];
 *
 * <nuverial-radio-cards [legend]="'this is a legend'" [formControl]="radioControl" [radioCards]="radioCards" />
 *
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatRadioModule, NuverialIconComponent, NuverialCardGroupComponent, NuverialRadioCardComponent],
  providers: [{ provide: NuverialCardCommonComponent, useExisting: forwardRef(() => NuverialRadioCardsComponent) }],
  selector: 'nuverial-radio-cards',
  standalone: true,
  styleUrls: ['./radio-cards.component.scss'],
  templateUrl: './radio-cards.component.html',
})
export class NuverialRadioCardsComponent extends FormInputBaseDirective {
  /**
   * Card is required indicator
   */
  @Input() public required = false;

  @Input() public legend: string | undefined;
  @Input() public radioCards!: INuverialRadioCard[];

  /**
   * Output change event from card
   */
  @Output() public readonly change = new EventEmitter<CardChange>();

  public inputId!: string | undefined;
  public cardType: CardTypes = 'radio';
  protected _cardGroupComponent: NuverialCardGroupComponent | null = null;

  public communication: string | undefined;
  public preference: string | undefined;
  public communicationMethod: string | undefined;
  public requiredCommunicationMsg: string | undefined;
  public props: string | undefined;

  constructor(
    protected _changeDetectorRef: ChangeDetectorRef,
    protected _elementRef: ElementRef,
    @Inject(Injector) protected override readonly _injector: Injector,
    protected readonly _focusMonitor: FocusMonitor,
    protected _loggingService: LoggingService,
  ) {
    super();
    this._cardGroupComponent = this._injector.get(NuverialCardGroupComponent, null);
  }

  public trackByFn(_index: number, option: INuverialRadioCard) {
    return option.title;
  }

  public markForCheck() {
    this._changeDetectorRef.markForCheck();
  }
  public validate(control: AbstractControl) {
    const isValid = coerceBooleanProperty(control.value);

    if (this.required) {
      return isValid ? null : { required: true };
    }

    return null;
  }
}
