# EduCore Architecture Documentation

## System Architecture

### Overview
EduCore follows a modern, scalable architecture with clear separation between frontend and backend, supporting multi-tenancy and role-based access control.

## Backend Architecture

### Technology Stack
- **Framework**: Django 4.2.7
- **API**: Django REST Framework 3.14.0
- **Database**: PostgreSQL 14+
- **Cache**: Redis
- **Task Queue**: Celery
- **Authentication**: JWT (Simple JWT)

### Application Structure

```
backend/
├── apps/
│   ├── core/              # Shared utilities, base models, middleware
│   ├── tenants/           # Multi-tenancy management
│   ├── users/             # Authentication & user management
│   ├── academics/         # Classes, subjects, timetable
│   ├── students/          # Student & guardian management
│   ├── attendance/        # Attendance tracking
│   ├── assessments/       # Grades, assignments, report cards
│   ├── fees/              # Fee management & payments
│   ├── communications/    # SMS, notifications, messaging
│   └── lms/               # e-Learning module
└── educore/               # Django project settings
```

### Multi-Tenancy Strategy

**Current Implementation**: Shared Database with Tenant ID
- All models include a `tenant` ForeignKey
- Middleware extracts tenant from subdomain or header
- Row-level filtering ensures data isolation
- Future: Support for isolated databases per tenant (premium feature)

### Data Model Highlights

#### Core Models
- `BaseModel`: Abstract base with timestamps and soft delete
- `Tenant`: School/tenant information
- `User`: Custom user model with roles
- `AuditLog`: Action tracking

#### Key Relationships
- User → Tenant (Many-to-One)
- Student → User (One-to-One)
- Student → Class (Many-to-One)
- Student → Guardian (Many-to-Many via StudentGuardian)
- Attendance → Student (Many-to-One)
- FeeInvoice → Student (Many-to-One)
- Payment → FeeInvoice (Many-to-One)

### API Design

**RESTful API** with the following patterns:
- `/api/{resource}/` - List/Create
- `/api/{resource}/{id}/` - Retrieve/Update/Delete
- `/api/{resource}/{id}/{action}/` - Custom actions

**Authentication**: JWT tokens in Authorization header
**Pagination**: Page-based (50 items per page)
**Filtering**: Query parameters (e.g., `?class=1&status=active`)

### Security

1. **Authentication**
   - JWT tokens with refresh mechanism
   - Token expiration (1 hour access, 7 days refresh)

2. **Authorization**
   - Role-based access control (RBAC)
   - Permission classes per viewset
   - Tenant-level data isolation

3. **Data Protection**
   - Tenant middleware ensures data isolation
   - Soft deletes for data retention
   - Audit logging for critical actions

## Frontend Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) 5
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **HTTP Client**: Axios

### Application Structure

```
frontend/src/
├── components/        # Reusable UI components
│   ├── Layout.tsx    # Main layout with navigation
│   └── PrivateRoute.tsx
├── contexts/         # React contexts
│   └── AuthContext.tsx
├── pages/            # Page components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Students.tsx
│   ├── Attendance.tsx
│   ├── Assessments.tsx
│   ├── Fees.tsx
│   ├── Classes.tsx
│   ├── Messages.tsx
│   └── LMS.tsx
├── services/         # API service layer
│   ├── api.ts        # Base API client
│   ├── students.ts
│   ├── attendance.ts
│   ├── assessments.ts
│   ├── fees.ts
│   └── academics.ts
└── utils/            # Utility functions
    ├── constants.ts
    └── helpers.ts
```

### State Management

**React Query** for server state:
- Automatic caching
- Background refetching
- Optimistic updates
- Error handling

**React Context** for global state:
- Authentication state
- User information

### Routing

Protected routes using `PrivateRoute` component:
- Checks authentication status
- Redirects to login if not authenticated
- Role-based route access (future enhancement)

## Database Schema

### Key Tables

1. **tenants** - School/tenant information
2. **users** - User accounts
3. **students** - Student profiles
4. **guardians** - Parent/guardian information
5. **classes** - Class/Grade levels
6. **subjects** - Subjects
7. **timetable_slots** - Timetable entries
8. **attendances** - Attendance records
9. **assignments** - Assignments/Homework
10. **grades** - Grades/Scores
11. **fee_invoices** - Fee invoices
12. **payments** - Payment records
13. **notifications** - In-app notifications
14. **messages** - In-app messages
15. **courses** - e-Learning courses
16. **quizzes** - Quizzes/Tests

### Indexes

Critical indexes for performance:
- `students.student_id`
- `attendances(student, date)`
- `fee_invoices(student, status)`
- `audit_logs(user, created_at)`

## Deployment Architecture

### Development
- Local PostgreSQL database
- Local Redis instance
- Django development server
- React development server

### Production (Recommended)

**Option 1: Containerized (Docker)**
```
┌─────────────┐
│   Nginx     │ (Reverse Proxy)
└──────┬──────┘
       │
┌──────▼──────┐
│   React     │ (Static files)
└──────┬──────┘
       │
┌──────▼──────┐
│   Django    │ (API Server)
└──────┬──────┘
       │
┌──────▼──────┐
│ PostgreSQL  │
└─────────────┘
┌─────────────┐
│   Redis     │
└─────────────┘
```

**Option 2: Cloud Services**
- **Backend**: AWS ECS/EKS, GCP Cloud Run, Azure App Service
- **Database**: AWS RDS, Google Cloud SQL
- **Cache**: AWS ElastiCache, Google Cloud Memorystore
- **Storage**: AWS S3, Google Cloud Storage
- **CDN**: CloudFront, Cloudflare
- **Frontend**: Vercel, Netlify, or S3 + CloudFront

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers (multiple Django instances)
- Load balancer for request distribution
- Database connection pooling
- Redis for session/cache sharing

### Vertical Scaling
- Database optimization (indexes, query optimization)
- Caching strategies (Redis)
- Background task processing (Celery)

### Multi-Tenancy Scaling
- Current: Shared database (efficient for small-medium tenants)
- Future: Isolated databases for large tenants
- Hybrid approach: Shared for small, isolated for premium

## Security Architecture

### Network Security
- HTTPS/TLS for all communications
- CORS configuration
- Rate limiting (future)

### Application Security
- JWT authentication
- Password hashing (Django's PBKDF2)
- SQL injection protection (ORM)
- XSS protection (React's built-in escaping)
- CSRF protection (Django middleware)

### Data Security
- Tenant data isolation
- Encrypted sensitive data (future)
- Audit logging
- Data retention policies

## Monitoring & Observability

### Logging
- Application logs (Django logging)
- Error tracking (Sentry integration ready)
- Audit logs (database)

### Metrics (Future)
- Prometheus for metrics
- Grafana for visualization
- Application performance monitoring

## API Rate Limiting (Future)

- Per-tenant rate limits
- Per-user rate limits
- Different limits for different endpoints

## Backup & Disaster Recovery

### Database Backups
- Daily automated backups
- Point-in-time recovery
- Cross-region replication (future)

### Application Backups
- Code versioning (Git)
- Configuration management
- Infrastructure as Code (Terraform - future)

## Performance Optimization

### Backend
- Database query optimization
- Caching frequently accessed data
- Pagination for large datasets
- Background task processing

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- CDN for static assets

## Future Enhancements

1. **Real-time Features**
   - WebSocket support for live updates
   - Real-time notifications
   - Live chat

2. **Mobile Apps**
   - React Native app
   - Offline support
   - Push notifications

3. **Advanced Analytics**
   - Data warehouse
   - Business intelligence tools
   - Custom reporting

4. **AI/ML Integration**
   - Learning analytics
   - Predictive insights
   - Automated grading (MCQ)



