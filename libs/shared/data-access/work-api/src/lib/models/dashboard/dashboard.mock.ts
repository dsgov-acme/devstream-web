import { DashboardModel, IDashboard } from './dashboard.model';

export const DashboardMock: IDashboard = {
  columns: [
    {
      attributePath: 'priority',
      columnLabel: 'Priority',
      displayFormat: 'PRIORITY',
      sortable: true,
    },
    {
      attributePath: 'externalId',
      columnLabel: 'Transaction Id',
      sortable: false,
    },
    {
      attributePath: 'transactionDefinitionName',
      columnLabel: 'Type',
      sortable: false,
    },
    {
      attributePath: 'createdTimestamp',
      columnLabel: 'Date Created',
      displayFormat: 'DATETIME',
      sortable: true,
    },
    {
      attributePath: 'assignedTo',
      columnLabel: 'Assignee',
      displayFormat: 'USERDATA',
      sortable: false,
    },
    {
      attributePath: 'lastUpdatedTimestamp',
      columnLabel: 'Last Updated',
      displayFormat: 'DATETIME',
      sortable: true,
    },
    {
      attributePath: 'data.personalInformation.fullName',
      columnLabel: 'Claimant',
      sortable: false,
    },
    {
      attributePath: 'data.employmentInformation.employerName',
      columnLabel: 'Employer',
      sortable: false,
    },
  ],
  dashboardLabel: 'Claims',
  menuIcon: 'search',
  tabs: [
    {
      filter: {
        key: 'status',
        value: 'Approved',
      },
      tabLabel: 'Approved',
    },
    {
      filter: {
        key: 'status',
        value: 'Review',
      },
      tabLabel: 'Review',
    },
    {
      filter: {
        key: 'status',
        value: 'Denied',
      },
      tabLabel: 'Denied',
    },
    {
      filter: {
        key: 'status',
        value: 'Info Requested',
      },
      tabLabel: 'Info Requested',
    },
  ],
  transactionDefinitionKeys: [],
  transactionSet: 'FinancialBenefit',
};

export const DashboardMock2: IDashboard = {
  columns: [
    {
      attributePath: 'priority',
      columnLabel: 'Priority',
      displayFormat: 'PRIORITY',
      sortable: true,
    },
  ],
  dashboardLabel: 'Claims',
  menuIcon: 'search',
  tabs: [
    {
      filter: {
        key: 'status',
        value: 'Approved',
      },
      tabLabel: 'Approved',
    },
  ],
  transactionDefinitionKeys: [],
  transactionSet: 'VehicalRegistration',
};

export const DashboardModelMock = new DashboardModel(DashboardMock);
export const DashboardModelMock2 = new DashboardModel(DashboardMock2);

export const DashboardList = [DashboardModelMock, DashboardModelMock2];
