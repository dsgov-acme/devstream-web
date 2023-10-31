import { SchemaModel } from '@dsg/shared/data-access/http';

export interface IUserPreferences {
  preferredLanguage: string;
  preferredCommunicationMethod: string;
}

export class UserPreferencesModel implements SchemaModel<IUserPreferences, Partial<IUserPreferences>> {
  public preferredLanguage = '';
  public preferredCommunicationMethod = '';

  constructor(userPrefsSchema?: IUserPreferences) {
    if (userPrefsSchema) {
      this.fromSchema(userPrefsSchema);
    }
  }

  public fromSchema(userSchema: IUserPreferences) {
    this.preferredLanguage = userSchema.preferredLanguage || '';
    this.preferredCommunicationMethod = userSchema.preferredCommunicationMethod || '';
  }

  public toSchema(): Partial<IUserPreferences> {
    return {
      preferredCommunicationMethod: this.preferredCommunicationMethod || '',
      preferredLanguage: this.preferredLanguage || '',
    };
  }
}
