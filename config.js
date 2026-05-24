const CONFIG = {
    SUPABASE_URL: "https://ywpqvvriakbbhvrtpvso.supabase.co/rest/v1/",
    SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3cHF2dnJpYWtiYmh2cnRwdnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTc0NjcsImV4cCI6MjA5NTE5MzQ2N30.C8Y7bCgTsnz8jFUoUBv8gJTvH5i7LwzLVAq43sEV2Kk"
};
const supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

