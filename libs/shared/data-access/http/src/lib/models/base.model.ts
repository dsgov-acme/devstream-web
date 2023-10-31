export interface BaseModel<T> {
  toSchema(): T;
}

export abstract class SchemaModel<TFrom, TTo = TFrom> implements BaseModel<TTo> {
  public abstract fromSchema(schema: TFrom): void;
  public abstract toSchema(): TTo;
}
