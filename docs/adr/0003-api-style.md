# ADR-0003: API Style Choice - REST + SSE vs GraphQL

## Status
Accepted

## Context
For the Evenly expense-splitting application, we need to choose an API architecture that supports:
- Resource-centric operations (users, groups, expenses, settlements)
- Real-time updates for group members when expenses/settlements are added
- Type safety and developer experience
- Integration with Redux Toolkit on the frontend

The main options considered were:
1. **RESTful APIs with Server-Sent Events (SSE)**
2. **GraphQL with Subscriptions**

## Decision
We will use **RESTful APIs with Server-Sent Events (SSE)** for the Evenly application.

## Rationale

### Reasons for REST + SSE:

1. **Resource-Centric Data Model**: Our domain naturally maps to REST resources:
   - `/api/users` - User management
   - `/api/groups` - Group operations
   - `/api/groups/:id/expenses` - Expense management within groups
   - `/api/groups/:id/settlements` - Settlement operations
   - `/api/groups/:id/stream` - Real-time updates via SSE

2. **SSE Integration Simplicity**: 
   - SSE provides lightweight, one-way real-time communication
   - Natural fit with REST endpoints
   - Simpler infrastructure than WebSocket-based GraphQL subscriptions
   - Browser native support with EventSource API

3. **Redux Toolkit Alignment**:
   - RTK Query is optimized for REST APIs
   - Clear cache invalidation strategies
   - Predictable data fetching patterns

4. **Development Complexity**:
   - REST is simpler to implement and debug
   - Lower learning curve for team members
   - Established patterns and tooling

5. **Infrastructure Requirements**:
   - No need for WebSocket infrastructure
   - SSE works well with standard HTTP proxies
   - Simpler deployment and scaling considerations

### GraphQL Considerations Rejected:

1. **Subscription Complexity**: GraphQL subscriptions require WebSocket infrastructure and additional resolver complexity that's unnecessary for our use case.

2. **Over-Engineering**: Our data fetching patterns are straightforward and don't benefit significantly from GraphQL's query flexibility.

3. **Real-time Requirements**: SSE adequately meets our real-time needs (one-way updates to group members).

## Consequences

### Positive:
- Simpler implementation and maintenance
- Better alignment with chosen frontend stack (RTK Query)
- Lightweight real-time updates via SSE
- Clear API boundaries and caching strategies
- Easier testing and debugging

### Negative:
- Less flexibility in data fetching compared to GraphQL
- Potential for over-fetching in some scenarios
- Multiple round trips for related data (though this can be optimized with composite endpoints)

### Mitigation:
- Implement composite endpoints where beneficial (e.g., `/groups/:id` returning group + members + recent expenses)
- Consider read-only GraphQL layer in future for analytics and reporting needs
- Use SSE efficiently with proper event filtering per group

## Implementation Notes

### SSE Event Types:
```typescript
type ExpenseCreatedEvent = {
  type: "expense_created";
  groupId: string;
  expense: ExpenseDto;
  participants: ParticipantDto[];
};

type SettlementCreatedEvent = {
  type: "settlement_created";
  groupId: string;
  settlement: SettlementDto;
};
```

### REST API Structure:
- Base path: `/api`
- Versioning: `/api/v1` (future-proofing)
- Authentication: JWT in HttpOnly cookies
- Validation: Zod schemas for all endpoints

## Future Considerations
- If analytics and reporting needs grow complex, consider adding a read-only GraphQL layer
- Monitor API performance and consider composite endpoints for frequently accessed related data
- Evaluate WebSocket upgrade if bidirectional real-time communication becomes necessary

## References
- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [RTK Query Documentation](https://redux-toolkit.js.org/rtk-query/overview)
- [REST API Design Best Practices](https://restfulapi.net/)