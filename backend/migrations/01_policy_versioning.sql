-- Add current_version_id to policies table
ALTER TABLE public.policies 
ADD COLUMN IF NOT EXISTS current_version_id uuid;

-- Make legacy document_url nullable as we rely on versions now
ALTER TABLE public.policies
ALTER COLUMN document_url DROP NOT NULL;

-- Create policy_versions table
CREATE TABLE IF NOT EXISTS public.policy_versions (
    version_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id varchar(50) NOT NULL,
    version_number int NOT NULL,
    s3_bucket varchar(100) NOT NULL,
    s3_key text NOT NULL,
    change_summary text NULL,
    created_at timestamptz DEFAULT now(),
    created_by varchar(50) NOT NULL,
    status varchar(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'ARCHIVED')),
    metadata jsonb NULL,
    CONSTRAINT fk_policy_version
        FOREIGN KEY (policy_id)
        REFERENCES public.policies(policy_id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_policy_versions_policy_id ON public.policy_versions(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_versions_status ON public.policy_versions(status);
