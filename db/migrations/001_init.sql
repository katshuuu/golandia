-- Golandia IS: схема данных (ГОСТ 34.201-89, модель данных)
-- СУБД: PostgreSQL 16+

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name    VARCHAR(48) NOT NULL,
    goal            TEXT NOT NULL DEFAULT '',
    avatar_data_url TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_display_name_nonempty CHECK (char_length(trim(display_name)) >= 1),
    CONSTRAINT users_display_name_max CHECK (char_length(display_name) <= 48),
    CONSTRAINT users_goal_max CHECK (char_length(goal) <= 500)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id     VARCHAR(64) NOT NULL,
    completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, lesson_id),
    CONSTRAINT lesson_progress_lesson_id_nonempty CHECK (char_length(trim(lesson_id)) >= 1)
);

CREATE TABLE IF NOT EXISTS final_project_status (
    user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    completed   BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id         BIGSERIAL PRIMARY KEY,
    user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    action     VARCHAR(64) NOT NULL,
    payload    JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, created_at DESC);

-- Триггер: автообновление updated_at у users
CREATE OR REPLACE FUNCTION trg_users_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trg_users_set_updated_at();

-- Триггер: аудит изменения профиля
CREATE OR REPLACE FUNCTION trg_users_audit_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (user_id, action, payload)
    VALUES (
        NEW.id,
        'profile_update',
        jsonb_build_object(
            'display_name', NEW.display_name,
            'goal_len', char_length(NEW.goal)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_audit_profile ON users;
CREATE TRIGGER users_audit_profile
    AFTER INSERT OR UPDATE OF display_name, goal ON users
    FOR EACH ROW
    EXECUTE FUNCTION trg_users_audit_profile();

-- Триггер: аудит завершения урока
CREATE OR REPLACE FUNCTION trg_lesson_progress_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (user_id, action, payload)
    VALUES (
        NEW.user_id,
        'lesson_completed',
        jsonb_build_object('lesson_id', NEW.lesson_id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lesson_progress_audit ON lesson_progress;
CREATE TRIGGER lesson_progress_audit
    AFTER INSERT ON lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION trg_lesson_progress_audit();
