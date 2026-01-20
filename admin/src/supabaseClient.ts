import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qdrtpkqxkusgzjzrjdes.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnRwa3F4a3VzZ3pqenJqZGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTk5MTcsImV4cCI6MjA2Mjg5NTkxN30.w9A_Wvl0RDGPqN1j5E9r-OOm4l5mbwHOFhXRVKGDatM";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
