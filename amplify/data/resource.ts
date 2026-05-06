import { type ClientSchema, a, defineData } from '@aws-amplify/backend'

const schema = a.schema({
  Budget: a
    .model({
      category: a.string(),
      company: a.string(),
      budgetName: a.string(),
      amount: a.float(),
      omnicom: a.boolean(),
    })
    .authorization((allow) => [allow.group('admin'), allow.group('executive')]),
  Employee: a
    .model({
      primaryContact: a.string(),
      category: a.string(),
      companyBrand: a.string(),
      clientName: a.string(),
      clientTitle: a.string(),
    })
    .authorization((allow) => [
      allow.group('admin'),
      allow.group('executive'),
      allow.group('user'),
    ]),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
})
