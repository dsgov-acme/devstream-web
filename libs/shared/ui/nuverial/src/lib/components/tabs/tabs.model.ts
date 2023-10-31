import { TemplateRef } from '@angular/core';

export interface INuverialTab {
  count?: number;
  disabled?: boolean;
  key: string;
  value?: string;
  label: string;
  template?: TemplateRef<unknown>;
}

export interface ActiveTabChangeEvent {
  index: number;
  tab: INuverialTab;
}
