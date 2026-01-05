CREATE TABLE public.announcements (
	id varchar(255) NOT NULL,
	title varchar(255) NULL,
	description text NULL,
	"type" varchar(100) NULL,
	color varchar(50) NULL,
	created_at varchar(50) NULL,
	tenant_id varchar(50) NULL,
	updated_at varchar(20) NULL,
	page varchar(50) NULL,
	from_date varchar(20) NULL,
	to_date varchar(20) NULL,
	is_schedule bool DEFAULT false NULL,
	is_active bool DEFAULT true NULL
);

CREATE TABLE public.attendance (
	id varchar(50) NULL,
	employee_id int4 NOT NULL,
	"date" varchar(50) NOT NULL,
	check_in varchar(50) NULL,
	check_out varchar(50) NULL,
	status varchar(50) NULL,
	start_date varchar(50) NULL,
	end_date varchar(50) NULL,
	total_days int4 NULL,
	"type" varchar(50) NULL,
	reason text NULL,
	manager_reason text NULL,
	work_mode varchar(25) NULL,
	manager_id int4 NULL,
	created_at varchar(20) NULL,
	updated_at varchar(20) NULL,
	tenant_id varchar(50) NULL,
	CONSTRAINT attendance_unique UNIQUE (id),
	CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON DELETE CASCADE
);

CREATE TABLE public.dropdown_categories (
	id uuid NOT NULL,
	tenant_id uuid NULL,
	"key" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	description text NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT dropdown_categories_pkey PRIMARY KEY (id),
	CONSTRAINT fk_category_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

CREATE TABLE public.dropdown_options (
	id uuid NOT NULL,
	category_id uuid NOT NULL,
	value varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	sort_order int4 DEFAULT 0 NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT dropdown_options_pkey PRIMARY KEY (id),
	CONSTRAINT fk_option_category FOREIGN KEY (category_id) REFERENCES public.dropdown_categories(id) ON DELETE CASCADE
);


CREATE TABLE public.employees (
	employee_id int4 NOT NULL,
	name varchar(150) NOT NULL,
	email varchar(255) NOT NULL,
	phone varchar(20) NULL,
	"role" varchar(100) NULL,
	department varchar(100) NULL,
	"position" varchar(100) NULL,
	manager_id int4 NULL,
	dob varchar(20) NULL,
	join_date varchar(20) NULL,
	subsidiary varchar(100) NULL,
	"location" varchar(100) NULL,
	avatar_url text NULL,
	leaves_remaining int4 DEFAULT 0 NULL,
	leaderboard_points int4 DEFAULT 0 NULL,
	leave_balance int4 NULL,
	comp_off jsonb NULL,
	tenant_id varchar(50) NULL,
	created_at varchar(20) NULL,
	updated_at varchar(20) NULL,
	is_admin bool DEFAULT false NULL,
	is_active bool DEFAULT true NULL,
	avatar_key varchar(255) NULL,
	CONSTRAINT employees_email_key UNIQUE (email),
	CONSTRAINT employees_pkey PRIMARY KEY (employee_id),
	CONSTRAINT fk_manager FOREIGN KEY (manager_id) REFERENCES public.employees(employee_id) ON DELETE SET NULL
);


CREATE TABLE public.holidays (
	id varchar(50) NULL,
	"date" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"location" varchar(20) NOT NULL,
	tenant_id varchar(50) NULL,
	created_at varchar(20) NULL,
	updated_at varchar(20) NULL
);

CREATE TABLE public.leaves (
	id varchar(50) NULL,
	employee_id int4 NOT NULL,
	start_date varchar(20) NOT NULL,
	end_date varchar(20) NOT NULL,
	"type" varchar(50) NOT NULL,
	status varchar(20) DEFAULT 'Pending'::character varying NOT NULL,
	reason text NULL,
	manager_id int4 NULL,
	manager_notes text NULL,
	total_days int4 NULL,
	tenant_id varchar(50) NULL,
	created_at varchar(20) NULL,
	updated_at varchar(20) NULL,
	CONSTRAINT chk_leave_status CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::text[]))),
	CONSTRAINT fk_leaves_employee FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON DELETE CASCADE
);

CREATE TABLE public.policies (
	policy_id varchar(50) NOT NULL,
	policy_name varchar(200) NOT NULL,
	policy_type varchar(50) NOT NULL,
	document_url text NOT NULL,
	created_at varchar(20) NULL,
	updated_at varchar(20) NULL,
	tenant_id varchar(50) NULL,
	is_active bool DEFAULT true NULL,
	created_by varchar(50) NULL,
	description text NULL,
	CONSTRAINT policies_pk PRIMARY KEY (policy_id)
);