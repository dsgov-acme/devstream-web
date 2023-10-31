export interface AttributeBaseProperties {
  name: string;
  key: string;
  type: string;
  icon: string;
}

export enum AttributeTypes {
  STRING = 'String',
  BOOLEAN = 'Boolean',
  LOCALDATE = 'LocalDate',
  LOCALTIME = 'LocalTime',
  DOCUMENT = 'Document',
  LIST = 'List',
  DYNAMICENTITY = 'DynamicEntity',
  INTEGER = 'Integer',
  BIGDECIMAL = 'BigDecimal',
}

export const typeToIconMap: Map<AttributeTypes, string> = new Map([
  [AttributeTypes.STRING, 'far fa-grip-lines'],
  [AttributeTypes.BOOLEAN, 'regular fa-circle-dot'],
  [AttributeTypes.LOCALDATE, 'regular fa-calendar'],
  [AttributeTypes.LOCALTIME, 'regular fa-clock'],
  [AttributeTypes.DOCUMENT, 'file-lines'],
  [AttributeTypes.LIST, 'list'],
  [AttributeTypes.DYNAMICENTITY, 'share-nodes'],
  [AttributeTypes.INTEGER, '1'],
  [AttributeTypes.BIGDECIMAL, 'arrow-right-long'],
]);
