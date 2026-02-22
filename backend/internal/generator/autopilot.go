package generator

import "strings"

func addAutopilotBoilerplate(tree *FileTree, req GenerateRequest, root string) {
	switch req.Language {
	case "go":
		addGoAutopilot(tree, req, root)
	case "node":
		addNodeAutopilot(tree, req, root)
	case "python":
		addPythonAutopilot(tree, req, root)
	}
}

func addDBRetry(tree *FileTree, req GenerateRequest, root string) {
	switch req.Language {
	case "go":
		addFile(tree, autopilotPath(root, "internal/db/retry.go"), goDBRetry())
	case "node":
		addFile(tree, autopilotPath(root, "src/db/retry.js"), nodeDBRetry())
	case "python":
		if req.Framework == "django" {
			addFile(tree, autopilotPath(root, "api/db/retry.py"), pythonDjangoDBRetry())
			return
		}
		addFile(tree, autopilotPath(root, "app/db/retry.py"), pythonFastAPIDBRetry())
	}
}

func addGoAutopilot(tree *FileTree, req GenerateRequest, root string) {
	if req.Framework == "fiber" {
		addFile(tree, autopilotPath(root, "internal/middleware/request_id.go"), goFiberRequestIDMiddleware())
		addFile(tree, autopilotPath(root, "internal/middleware/request_logging.go"), goFiberRequestLoggingMiddleware())
	} else {
		addFile(tree, autopilotPath(root, "internal/middleware/request_id.go"), goGinRequestIDMiddleware())
		addFile(tree, autopilotPath(root, "internal/middleware/request_logging.go"), goGinRequestLoggingMiddleware())
	}
	addFile(tree, autopilotPath(root, "internal/pagination/pagination.go"), goPaginationHelper())
}

func addNodeAutopilot(tree *FileTree, _ GenerateRequest, root string) {
	addFile(tree, autopilotPath(root, "src/middleware/requestId.js"), nodeRequestIDMiddleware())
	addFile(tree, autopilotPath(root, "src/middleware/requestLogging.js"), nodeRequestLoggingMiddleware())
	addFile(tree, autopilotPath(root, "src/utils/pagination.js"), nodePaginationHelper())
}

func addPythonAutopilot(tree *FileTree, req GenerateRequest, root string) {
	if req.Framework == "django" {
		addFile(tree, autopilotPath(root, "api/middleware/request_id.py"), pythonDjangoRequestIDMiddleware())
		addFile(tree, autopilotPath(root, "api/middleware/request_logging.py"), pythonDjangoRequestLoggingMiddleware())
		addFile(tree, autopilotPath(root, "api/utils/pagination.py"), pythonPaginationHelper())
		return
	}
	addFile(tree, autopilotPath(root, "app/middleware/request_id.py"), pythonFastAPIRequestIDMiddleware())
	addFile(tree, autopilotPath(root, "app/middleware/request_logging.py"), pythonFastAPIRequestLoggingMiddleware())
	addFile(tree, autopilotPath(root, "app/utils/pagination.py"), pythonPaginationHelper())
}

func autopilotPath(root, rel string) string {
	if strings.TrimSpace(root) == "" {
		return rel
	}
	return root + "/" + rel
}

func goGinRequestIDMiddleware() string {
	return `package middleware

import (
	"context"
	"crypto/rand"
	"encoding/hex"

	"github.com/gin-gonic/gin"
)

type requestIDKey struct{}

func RequestIDFromContext(ctx context.Context) string {
	if v, ok := ctx.Value(requestIDKey{}).(string); ok {
		return v
	}
	return ""
}

func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		reqID := c.GetHeader("X-Request-ID")
		if reqID == "" {
			reqID = newRequestID()
		}

		ctx := context.WithValue(c.Request.Context(), requestIDKey{}, reqID)
		c.Request = c.Request.WithContext(ctx)
		c.Set("request_id", reqID)
		c.Header("X-Request-ID", reqID)
		c.Next()
	}
}

func newRequestID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "00000000000000000000000000000000"
	}
	return hex.EncodeToString(b)
}
`
}

func goFiberRequestIDMiddleware() string {
	return `package middleware

import (
	"context"
	"crypto/rand"
	"encoding/hex"

	"github.com/gofiber/fiber/v2"
)

type requestIDKey struct{}

func RequestIDFromContext(ctx context.Context) string {
	if v, ok := ctx.Value(requestIDKey{}).(string); ok {
		return v
	}
	return ""
}

func RequestID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		reqID := c.Get("X-Request-ID")
		if reqID == "" {
			reqID = newRequestID()
		}

		ctx := context.WithValue(c.UserContext(), requestIDKey{}, reqID)
		c.SetUserContext(ctx)
		c.Locals("request_id", reqID)
		c.Set("X-Request-ID", reqID)
		return c.Next()
	}
}

func newRequestID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "00000000000000000000000000000000"
	}
	return hex.EncodeToString(b)
}
`
}

func goGinRequestLoggingMiddleware() string {
	return `package middleware

import (
	"log/slog"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

var requestLogger = slog.New(slog.NewJSONHandler(os.Stdout, nil))

func RequestLogging() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		reqID, _ := c.Get("request_id")
		requestLogger.Info("request_complete",
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status_code", c.Writer.Status(),
			"latency_ms", time.Since(start).Milliseconds(),
			"request_id", reqID,
		)
	}
}
`
}

func goFiberRequestLoggingMiddleware() string {
	return `package middleware

import (
	"log/slog"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
)

var requestLogger = slog.New(slog.NewJSONHandler(os.Stdout, nil))

func RequestLogging() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()

		requestLogger.Info("request_complete",
			"method", c.Method(),
			"path", c.Path(),
			"status_code", c.Response().StatusCode(),
			"latency_ms", time.Since(start).Milliseconds(),
			"request_id", c.Locals("request_id"),
		)
		return err
	}
}
`
}

func goPaginationHelper() string {
	return `package pagination

import (
	"net/http"
	"strconv"
)

const (
	DefaultLimit = 20
	MaxLimit     = 100
)

func Parse(r *http.Request) (limit int, offset int) {
	q := r.URL.Query()

	limit = DefaultLimit
	if raw := q.Get("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if limit > MaxLimit {
		limit = MaxLimit
	}

	offset = 0
	if raw := q.Get("offset"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed >= 0 {
			offset = parsed
		}
	}
	return limit, offset
}
`
}

func goDBRetry() string {
	return `package db

import (
	"log/slog"
	"os"
	"time"
)

var dbLogger = slog.New(slog.NewJSONHandler(os.Stdout, nil))

func MustConnectWithRetry(connect func() error) {
	const maxRetries = 10
	for attempt := 1; attempt <= maxRetries; attempt++ {
		if err := connect(); err == nil {
			dbLogger.Info("db_connected", "attempt", attempt)
			return
		} else {
			if attempt == maxRetries {
				dbLogger.Error("db_connect_failed", "attempt", attempt, "max_retries", maxRetries, "error", err)
				panic("database connection failed after retries")
			}

			wait := time.Second << (attempt - 1)
			dbLogger.Warn("db_connect_retry", "attempt", attempt, "next_wait_ms", wait.Milliseconds(), "error", err)
			time.Sleep(wait)
		}
	}
}
`
}

func nodeRequestIDMiddleware() string {
	return `import { randomUUID } from 'node:crypto';

export function requestIdMiddleware(req, res, next) {
  const requestId = req.header('X-Request-ID') || randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}
`
}

func nodeRequestLoggingMiddleware() string {
	return `export function requestLoggingMiddleware(req, res, next) {
  const startedAt = Date.now();

  res.on('finish', () => {
    const log = {
      level: 'info',
      event: 'request_complete',
      method: req.method,
      path: req.originalUrl || req.url,
      status_code: res.statusCode,
      latency_ms: Date.now() - startedAt,
      request_id: req.requestId || null,
    };
    console.log(JSON.stringify(log));
  });

  next();
}
`
}

func nodePaginationHelper() string {
	return `const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(query = {}) {
  let limit = Number.parseInt(query.limit, 10);
  if (!Number.isFinite(limit) || limit <= 0) {
    limit = DEFAULT_LIMIT;
  }
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  let offset = Number.parseInt(query.offset, 10);
  if (!Number.isFinite(offset) || offset < 0) {
    offset = 0;
  }

  return { limit, offset };
}
`
}

func nodeDBRetry() string {
	return `function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectWithRetry(connectFn, options = {}) {
  const maxRetries = options.maxRetries ?? 10;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await connectFn();
      console.log(JSON.stringify({ level: 'info', event: 'db_connected', attempt }));
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(JSON.stringify({
          level: 'error',
          event: 'db_connect_failed',
          attempt,
          max_retries: maxRetries,
          error: error?.message || String(error),
        }));
        throw new Error('database connection failed after retries');
      }

      const waitMs = 1000 * (2 ** (attempt - 1));
      console.warn(JSON.stringify({
        level: 'warn',
        event: 'db_connect_retry',
        attempt,
        next_wait_ms: waitMs,
        error: error?.message || String(error),
      }));
      await sleep(waitMs);
    }
  }
}
`
}

func pythonFastAPIRequestIDMiddleware() string {
	return `import uuid
from starlette.middleware.base import BaseHTTPMiddleware


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
`
}

func pythonFastAPIRequestLoggingMiddleware() string {
	return `import json
import logging
import time
from starlette.middleware.base import BaseHTTPMiddleware


logger = logging.getLogger("stacksprint.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        started_at = time.perf_counter()
        response = await call_next(request)
        latency_ms = int((time.perf_counter() - started_at) * 1000)

        payload = {
            "event": "request_complete",
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "latency_ms": latency_ms,
            "request_id": getattr(request.state, "request_id", None),
        }
        logger.info(json.dumps(payload))
        return response
`
}

func pythonDjangoRequestIDMiddleware() string {
	return `import uuid


class RequestIDMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.request_id = request_id
        response = self.get_response(request)
        response["X-Request-ID"] = request_id
        return response
`
}

func pythonDjangoRequestLoggingMiddleware() string {
	return `import json
import logging
import time


logger = logging.getLogger("stacksprint.request")


class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        started_at = time.perf_counter()
        response = self.get_response(request)
        latency_ms = int((time.perf_counter() - started_at) * 1000)

        payload = {
            "event": "request_complete",
            "method": request.method,
            "path": request.path,
            "status_code": response.status_code,
            "latency_ms": latency_ms,
            "request_id": getattr(request, "request_id", None),
        }
        logger.info(json.dumps(payload))
        return response
`
}

func pythonPaginationHelper() string {
	return `DEFAULT_LIMIT = 20
MAX_LIMIT = 100


def parse_pagination(params):
    raw_limit = params.get("limit")
    try:
        limit = int(raw_limit) if raw_limit is not None else DEFAULT_LIMIT
    except (TypeError, ValueError):
        limit = DEFAULT_LIMIT
    if limit <= 0:
        limit = DEFAULT_LIMIT
    if limit > MAX_LIMIT:
        limit = MAX_LIMIT

    raw_offset = params.get("offset")
    try:
        offset = int(raw_offset) if raw_offset is not None else 0
    except (TypeError, ValueError):
        offset = 0
    if offset < 0:
        offset = 0

    return limit, offset
`
}

func pythonFastAPIDBRetry() string {
	return `import json
import logging
import time


logger = logging.getLogger("stacksprint.db")


def connect_with_retry(connect_fn, max_retries=10):
    for attempt in range(1, max_retries + 1):
        try:
            connect_fn()
            logger.info(json.dumps({"event": "db_connected", "attempt": attempt}))
            return
        except Exception as exc:
            if attempt == max_retries:
                logger.error(
                    json.dumps(
                        {
                            "event": "db_connect_failed",
                            "attempt": attempt,
                            "max_retries": max_retries,
                            "error": str(exc),
                        }
                    )
                )
                raise RuntimeError("database connection failed after retries") from exc

            wait_seconds = 2 ** (attempt - 1)
            logger.warning(
                json.dumps(
                    {
                        "event": "db_connect_retry",
                        "attempt": attempt,
                        "next_wait_ms": wait_seconds * 1000,
                        "error": str(exc),
                    }
                )
            )
            time.sleep(wait_seconds)
`
}

func pythonDjangoDBRetry() string {
	return `import json
import logging
import time


logger = logging.getLogger("stacksprint.db")


def connect_with_retry(connect_fn, max_retries=10):
    for attempt in range(1, max_retries + 1):
        try:
            connect_fn()
            logger.info(json.dumps({"event": "db_connected", "attempt": attempt}))
            return
        except Exception as exc:
            if attempt == max_retries:
                logger.error(
                    json.dumps(
                        {
                            "event": "db_connect_failed",
                            "attempt": attempt,
                            "max_retries": max_retries,
                            "error": str(exc),
                        }
                    )
                )
                raise RuntimeError("database connection failed after retries") from exc

            wait_seconds = 2 ** (attempt - 1)
            logger.warning(
                json.dumps(
                    {
                        "event": "db_connect_retry",
                        "attempt": attempt,
                        "next_wait_ms": wait_seconds * 1000,
                        "error": str(exc),
                    }
                )
            )
            time.sleep(wait_seconds)
`
}
