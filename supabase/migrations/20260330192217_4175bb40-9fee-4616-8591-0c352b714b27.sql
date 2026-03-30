DELETE FROM public.installations
WHERE id NOT IN (
  SELECT DISTINCT ON (frontend_url) id
  FROM public.installations
  ORDER BY frontend_url, updated_at DESC
);