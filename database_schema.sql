# Submeet - Database Schema Design

## Core Entities

### Organizations
Literary magazines, presses, organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  country TEXT,
  currency TEXT DEFAULT 'USD',
  stripe_account_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Publications
Individual magazines/journals under organizations
```sql
CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  editorial_statement TEXT,
  genres TEXT[], -- array of supported genres
  reading_period_start DATE,
  reading_period_end DATE,
  is_accepting_submissions BOOLEAN DEFAULT FALSE,
  average_response_time_days INTEGER,
  acceptance_rate DECIMAL(5,2),
  pays_writers BOOLEAN DEFAULT FALSE,
  submission_fee_cents INTEGER DEFAULT 0,
  fee_waiver_available BOOLEAN DEFAULT TRUE,
  social_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Users
Universal accounts for writers, readers, editors
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  website TEXT,
  avatar_url TEXT,
  phone TEXT,
  address JSONB,
  social_links JSONB,
  email_notifications BOOLEAN DEFAULT TRUE,
  email_frequency TEXT DEFAULT 'immediate', -- immediate, daily, weekly
  preferred_genres TEXT[],
  country TEXT,
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Roles (many-to-many with publications)
```sql
CREATE TABLE user_publication_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('writer', 'reader', 'editor', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, publication_id, role)
);
```

### Forms (Submission Forms)
```sql
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  fields JSONB NOT NULL, -- form field configuration
  is_active BOOLEAN DEFAULT TRUE,
  submission_cap INTEGER,
  current_submission_count INTEGER DEFAULT 0,
  reading_period_start DATE,
  reading_period_end DATE,
  allow_simultaneous_submissions BOOLEAN DEFAULT TRUE,
  response_time_estimate_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Submissions
```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  genre TEXT,
  word_count INTEGER,
  language TEXT DEFAULT 'English',
  is_translation BOOLEAN DEFAULT FALSE,
  original_language TEXT,
  translator_name TEXT,
  cover_letter TEXT,
  author_bio TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'shortlisted', 'accepted', 'declined', 'withdrawn')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  withdrawal_reason TEXT,
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  is_simultaneous_submission BOOLEAN DEFAULT FALSE,
  simultaneous_submission_status TEXT CHECK (simultaneous_submission_status IN ('active', 'accepted_elsewhere', 'withdrawn'))
);
```

### Submission Files
```sql
CREATE TABLE submission_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  file_path TEXT NOT NULL, -- R2 storage path
  file_hash TEXT NOT NULL, -- for duplicate detection
  file_type TEXT CHECK (file_type IN ('manuscript', 'cover_letter', 'bio', 'art', 'audio', 'other')),
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Reviews (Reader Evaluations)
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  recommendation TEXT CHECK (recommendation IN ('pass', 'maybe', 'yes')),
  comments TEXT,
  is_complete BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Decisions
```sql
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('accept', 'decline', 'revise_resubmit', 'shortlist')),
  decision_text TEXT,
  template_id UUID, -- reference to decision templates
  decided_by UUID REFERENCES users(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Decision Templates
```sql
CREATE TABLE decision_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('accept', 'decline', 'revise_resubmit', 'shortlist')),
  subject_template TEXT,
  body_template TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Discovery/Directory Features
```sql
-- Journal bookmarks (for writers)
CREATE TABLE journal_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, publication_id)
);

-- Reading period notifications
CREATE TABLE reading_period_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,
  notification_type TEXT CHECK (notification_type IN ('opens', 'closes', 'both')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Analytics & Tracking
```sql
-- Submission analytics
CREATE TABLE submission_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_submissions INTEGER DEFAULT 0,
  pending_submissions INTEGER DEFAULT 0,
  under_review_submissions INTEGER DEFAULT 0,
  accepted_submissions INTEGER DEFAULT 0,
  declined_submissions INTEGER DEFAULT 0,
  average_response_time_days DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(publication_id, date)
);

-- User activity tracking
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- submission_created, review_completed, etc.
  entity_type TEXT NOT NULL, -- submission, review, etc.
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

-- Indexes for performance
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_form_id ON submissions(form_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_genre ON submissions(genre);
CREATE INDEX idx_reviews_submission_id ON reviews(submission_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_user_publication_roles_user_id ON user_publication_roles(user_id);
CREATE INDEX idx_user_publication_roles_publication_id ON user_publication_roles(publication_id);
CREATE INDEX idx_forms_publication_id ON forms(publication_id);
CREATE INDEX idx_publications_organization_id ON publications(organization_id);