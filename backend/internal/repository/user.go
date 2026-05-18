package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// UserRepository — паттерн «Репозиторий»: абстракция доступа к данным пользователя.
type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

type UserProfile struct {
	ID            string    `json:"id"`
	DisplayName   string    `json:"display_name"`
	Goal          string    `json:"goal"`
	AvatarDataURL string    `json:"avatar_data_url"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type UserProgress struct {
	CompletedLessons map[string]bool `json:"completed_lessons"`
	FinalProjectDone bool            `json:"final_project_done"`
}

func (r *UserRepository) EnsureUser(ctx context.Context, id, displayName string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO users (id, display_name)
		VALUES ($1, $2)
		ON CONFLICT (id) DO NOTHING
	`, id, displayName)
	return err
}

func (r *UserRepository) GetProfile(ctx context.Context, id string) (UserProfile, error) {
	var p UserProfile
	err := r.pool.QueryRow(ctx, `
		SELECT id, display_name, goal, avatar_data_url, updated_at
		FROM users WHERE id = $1
	`, id).Scan(&p.ID, &p.DisplayName, &p.Goal, &p.AvatarDataURL, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return p, fmt.Errorf("user not found")
	}
	return p, err
}

func (r *UserRepository) UpsertProfile(ctx context.Context, id string, displayName, goal, avatar string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO users (id, display_name, goal, avatar_data_url)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (id) DO UPDATE SET
			display_name = EXCLUDED.display_name,
			goal = EXCLUDED.goal,
			avatar_data_url = EXCLUDED.avatar_data_url
	`, id, displayName, goal, avatar)
	return err
}

func (r *UserRepository) GetProgress(ctx context.Context, id string) (UserProgress, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT lesson_id FROM lesson_progress WHERE user_id = $1
	`, id)
	if err != nil {
		return UserProgress{}, err
	}
	defer rows.Close()

	done := map[string]bool{}
	for rows.Next() {
		var lessonID string
		if err := rows.Scan(&lessonID); err != nil {
			return UserProgress{}, err
		}
		done[lessonID] = true
	}
	if err := rows.Err(); err != nil {
		return UserProgress{}, err
	}

	var finalDone bool
	err = r.pool.QueryRow(ctx, `
		SELECT COALESCE(completed, false) FROM final_project_status WHERE user_id = $1
	`, id).Scan(&finalDone)
	if errors.Is(err, pgx.ErrNoRows) {
		finalDone = false
	} else if err != nil {
		return UserProgress{}, err
	}

	return UserProgress{CompletedLessons: done, FinalProjectDone: finalDone}, nil
}

func (r *UserRepository) SaveProgress(ctx context.Context, id string, completed map[string]bool, finalDone bool) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM lesson_progress WHERE user_id = $1`, id); err != nil {
		return err
	}
	for lessonID, ok := range completed {
		if !ok {
			continue
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO lesson_progress (user_id, lesson_id) VALUES ($1, $2)
			ON CONFLICT DO NOTHING
		`, id, lessonID); err != nil {
			return err
		}
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO final_project_status (user_id, completed, updated_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (user_id) DO UPDATE SET completed = EXCLUDED.completed, updated_at = NOW()
	`, id, finalDone); err != nil {
		return err
	}

	return tx.Commit(ctx)
}
