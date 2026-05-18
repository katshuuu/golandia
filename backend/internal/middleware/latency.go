package middleware

import (
	"log"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

const maxAcceptableLatency = 3 * time.Second

// ResponseTimeLog — контроль времени реакции (ГОСТ 34.602-89, п. 3.2.4.6).
func ResponseTimeLog() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		elapsed := time.Since(start)
		c.Header("X-Response-Time-Ms", formatMs(elapsed))
		if elapsed > maxAcceptableLatency {
			log.Printf("slow request %s %s: %s", c.Request.Method, c.Request.URL.Path, elapsed)
		}
	}
}

func formatMs(d time.Duration) string {
	ms := d.Milliseconds()
	if ms < 0 {
		ms = 0
	}
	return strconv.FormatInt(ms, 10)
}
