# TransitOps Master Goal Document 2

# Engineering Rules, Security, Scalability & Quality Gates

## Non-Negotiable Rules

-   No hardcoded values.
-   No mock implementations.
-   No controller business logic.
-   No direct controller-database communication.
-   No duplicated validation.
-   No bypassing RBAC.

## Security Goals

JWT authentication Refresh tokens (optional) Password hashing
Parameterized ORM queries SQL Injection prevention XSS prevention Input
validation Output sanitization Strict CORS Helmet/security headers
Environment variables Rate limiting Request size limits Secure cookies
if applicable Audit logging for privileged actions

## Validation

Every request: Schema Validation → Business Validation → Permission
Validation → Database Validation

## Transactions

Dispatch, completion, maintenance and financial operations must be ACID
transactions with automatic rollback.

## Error Handling

Global exception handler. Consistent response format. Meaningful error
codes. Graceful recovery. Never expose stack traces. Frontend must
display friendly messages.

## Frontend Standards

Skeleton loaders Loading indicators Empty states Error states Retry
actions Optimistic updates only when safe Responsive layouts
Accessibility minded components

## Backend Standards

Feature modules Service layer Repository layer Shared utilities Shared
validators Shared rule engine Shared logger

## Performance

Pagination Lazy loading Memoization Caching where safe Indexed queries
Debounced search Minimal payloads Avoid N+1 queries

## Observability

Structured logs Audit logs Performance timing Meaningful warnings Health
endpoints

## Quality Gate (Every Feature)

Functional ✓ Secure ✓ Transactional ✓ Responsive ✓ Reusable ✓ Accessible
✓ Scalable ✓ Maintainable ✓ Documented ✓ Testable ✓

Agent Goal: Every line of code should be production quality, not
hackathon quality.
