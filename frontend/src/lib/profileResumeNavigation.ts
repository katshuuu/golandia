/** Параметры «продолжить с профиля» передаются через `location.state` у маршрута `/`. */
export type ProfileResumePayload = {
  lessonId: string
  moduleNum: number
}

export type ProfileLocationState = {
  profileResume?: ProfileResumePayload
}
