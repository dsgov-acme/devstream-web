import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dsgSplitCamelCase',
  standalone: true,
})
export class SplitCamelCasePipe implements PipeTransform {
  public transform(value: string): string {
    if (typeof value !== 'string') {
      return value;
    }

    return value.replace(/([A-Z])/g, match => ` ${match}`).replace(/^./, match => match.toUpperCase());
  }
}
