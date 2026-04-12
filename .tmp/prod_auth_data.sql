SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict FU6Caoubadyg3hVlycY2jyOsOIR6DC3gA8f9syl6tdq2dYySbpMy8h5L9ecooJe

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") VALUES
	('48a2af13-6721-4780-a565-f656bff89821', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', '520cbbcc-d6ab-41df-bd3f-80272cc36d24', 's256', 'UVqeUamrZLN3fllAn6wu083QYRYazjrmC_4TcMNb2JA', 'email', '', '', '2026-02-01 13:47:49.526131+00', '2026-02-01 13:48:31.707886+00', 'email/signup', '2026-02-01 13:48:31.707848+00', NULL, NULL, NULL, NULL, false),
	('d7c4aac6-f4c1-49bd-bd71-f4f25440137c', 'b9d6807c-bce6-4deb-9dc5-927bdcb6028a', '67d451cd-81f5-4719-b2e7-cc0dbbbcabcb', 's256', 'cEq6WbpavXMi-cLUn2zW6GQFOz6PEjgBQCaq-bJMER0', 'email', '', '', '2026-02-15 14:54:43.426161+00', '2026-02-15 14:54:43.426161+00', 'email/signup', NULL, NULL, NULL, NULL, NULL, false),
	('5cf1388f-89cd-478e-8a42-7468a98950bd', 'f017e955-7005-49fa-b250-1d3ec597d771', '549b6dd9-633b-4b2f-90ba-a737055ea6fd', 's256', 'UJIDQqGpYJJ5wOdqM6a02uWzSNEeJ7HNH4sNKTBddfs', 'email', '', '', '2026-02-15 15:01:17.393023+00', '2026-02-15 15:01:17.393023+00', 'email/signup', NULL, NULL, NULL, NULL, NULL, false),
	('0d99cc3d-515e-4051-b6b0-6683b1cbc61d', 'e40e90f2-a751-4539-b6af-281868ba9be9', 'd0af67ed-6e70-4a3e-ab3e-e4c6475108ad', 's256', 'S6k0mJwGalmXiMd6PvudAbvde9p5R57U3rQ99mNp54o', 'email', '', '', '2026-02-21 18:49:31.75011+00', '2026-02-21 18:49:55.98793+00', 'email/signup', '2026-02-21 18:49:55.987876+00', NULL, NULL, NULL, NULL, false),
	('65b8b1bd-a255-440a-953c-81c93ef4e822', 'ad1e9ff4-1c1c-4f1e-8fc1-76665d84a7a0', '4b2f2550-7a4f-4412-9fdb-b6943310e63b', 's256', 'I2FZK4KgkrxV5O613FnBYhizdB88g49SPKwpeUddaFU', 'email', '', '', '2026-03-08 19:59:15.183238+00', '2026-03-08 20:05:40.587032+00', 'email/signup', '2026-03-08 20:05:40.586302+00', NULL, NULL, NULL, NULL, false),
	('419b64f5-35ca-4ec1-a7b0-5f9148755037', 'c36bb5bc-273f-4f4a-85f2-2f03bebdd493', '6263bd3a-b9cb-4a85-800c-13b17c24c6ae', 's256', 'b-nTmGCBlgbCkM_I5l3iJ4eVX7chAswb9dpTmbmM4Ag', 'email', '', '', '2026-03-15 16:21:37.189157+00', '2026-03-15 16:21:49.777817+00', 'email/signup', '2026-03-15 16:21:49.777763+00', NULL, NULL, NULL, NULL, false),
	('a72913f3-eb14-482f-8e5d-aec53ecee199', 'e3cb0ead-0e34-4190-abeb-bbaec9608372', '3f92bf36-096d-40b3-9f60-591ed548e61f', 's256', 'QKSQK_ZprwTlinHYyrHjy9NQE93dYlqwZx-HXKlbFWY', 'magiclink', '', '', '2026-03-22 20:43:38.887488+00', '2026-03-22 20:43:38.887488+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('175e0963-549b-46de-b719-eeaf1289baa6', NULL, 'c6582448-8fc5-45e1-9a3e-d3e5f3058dd0', 's256', 'GncTj_3yMkkYqv-3dCagrHTf_SJGdxkiuUvL1cRmwL0', 'google', '', '', '2026-03-22 21:07:06.566362+00', '2026-03-22 21:07:06.566362+00', 'oauth', NULL, NULL, 'https://www.dark-monkey.ch/pt/auth/callback', NULL, NULL, false),
	('98f08bcd-b1f9-4dfd-9829-453d4de7bbe8', NULL, '90e35269-5d6a-4a08-bc4c-b07cd5d17ebb', 's256', '7bGbDup1oY7hRsnV8Bwt-law3S1yyBX6vIVO7G3tw4Q', 'google', '', '', '2026-04-05 12:06:51.939418+00', '2026-04-05 12:06:51.939418+00', 'oauth', NULL, NULL, 'https://www.dark-monkey.ch/pt/auth/callback', NULL, NULL, false);


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'c36bb5bc-273f-4f4a-85f2-2f03bebdd493', 'authenticated', 'authenticated', 'hugosousa@gmx.ch', '$2a$10$5YkeaEo5NbHbCiKVuscthujsi7eBakGitEF3IDdRvDazoKCTm7d0.', '2026-03-15 16:21:49.767884+00', NULL, '', '2026-03-15 16:21:37.205482+00', '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"sub": "c36bb5bc-273f-4f4a-85f2-2f03bebdd493", "email": "hugosousa@gmx.ch", "email_verified": true, "phone_verified": false}', NULL, '2026-03-15 16:21:37.113097+00', '2026-03-15 16:21:49.771355+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '856884bf-4807-4747-93a6-3a239cc831e8', 'authenticated', 'authenticated', 'paulolopesreizinho@gmail.com', NULL, '2026-03-22 20:14:50.680908+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-03-22 20:14:51.299675+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "105653747404720187983", "name": "Paulo Reizinho", "email": "paulolopesreizinho@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocI0fmypygSdo_EZtLe0v06S78P7UPRwHqJO5HT5CdZqjc_8n3A=s96-c", "full_name": "Paulo Reizinho", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocI0fmypygSdo_EZtLe0v06S78P7UPRwHqJO5HT5CdZqjc_8n3A=s96-c", "provider_id": "105653747404720187983", "email_verified": true, "phone_verified": false}', NULL, '2026-03-22 20:14:50.657892+00', '2026-03-22 20:14:51.326767+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'ad1e9ff4-1c1c-4f1e-8fc1-76665d84a7a0', 'authenticated', 'authenticated', 'veramarta1993@hotmail.com', '$2a$10$A4Oj/RUTIRyqn1Pe33MQouIl8jSggBaw1V7Anm7spzmkwQshFtX52', '2026-03-08 20:05:40.551261+00', NULL, '', '2026-03-08 19:59:15.205204+00', '', NULL, '', '', NULL, '2026-03-08 20:06:47.224772+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "ad1e9ff4-1c1c-4f1e-8fc1-76665d84a7a0", "email": "veramarta1993@hotmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-08 19:59:15.120856+00', '2026-03-29 20:01:20.481407+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '31b164ed-276e-4ca5-afbd-a012127266bc', 'authenticated', 'authenticated', 'cansado.garage@gmail.com', '$2a$10$foxtCSd/tG4uNSJh8/MsteNnxQv3ghxiaxXS180zAaWlTPymo6vSS', '2026-03-29 20:28:45.583833+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-03-29 20:35:05.408877+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-03-29 20:27:42.532449+00', '2026-03-31 10:21:30.668804+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'e3cb0ead-0e34-4190-abeb-bbaec9608372', 'authenticated', 'authenticated', 'ricreizinho@gmail.com', '$2a$10$adULggA4aWhknT0WBSze.O6Wt2qZ/VlKxYC868xf/Hl9LU/uNkgdO', '2026-03-22 19:21:02.792224+00', NULL, '', '2026-03-22 19:18:01.882365+00', '', '2026-03-28 19:10:50.881933+00', '', '', NULL, '2026-04-01 22:29:40.311638+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-03-22 19:18:01.976126+00', '2026-04-02 07:52:21.900324+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'e40e90f2-a751-4539-b6af-281868ba9be9', 'authenticated', 'authenticated', 'goncalopinto1@outlook.com', '$2a$10$RlBl.W6/LQb2QM88OrV0vuVdjoMC2CPzwzjl1t9q2vtWibPmZq4aq', '2026-02-21 18:49:55.972008+00', NULL, '', '2026-02-21 18:49:31.762044+00', '', '2026-03-22 19:27:14.036137+00', '', '', NULL, '2026-03-28 21:22:13.951983+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "e40e90f2-a751-4539-b6af-281868ba9be9", "email": "goncalopinto1@outlook.com", "email_verified": true, "phone_verified": false}', NULL, '2026-02-21 18:49:31.715569+00', '2026-04-05 12:27:33.590216+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', 'authenticated', 'authenticated', 'paulo@lopes2tech.ch', '$2a$10$lm4FeC/lH6xrIkJlvaQs6e9AFlJfSMV.trwRWzlWZ7qTB7G7laZ8i', '2026-02-01 13:48:31.69845+00', NULL, '', '2026-02-01 13:47:49.536573+00', '', NULL, '', '', NULL, '2026-04-05 12:06:57.589952+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "e6d6fa08-96a9-445c-bd5e-748baaad689d", "email": "paulo@lopes2tech.ch", "email_verified": true, "phone_verified": false}', NULL, '2026-02-01 13:47:49.463942+00', '2026-04-05 12:35:08.685944+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('e6d6fa08-96a9-445c-bd5e-748baaad689d', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', '{"sub": "e6d6fa08-96a9-445c-bd5e-748baaad689d", "email": "paulo@lopes2tech.ch", "email_verified": true, "phone_verified": false}', 'email', '2026-02-01 13:47:49.516115+00', '2026-02-01 13:47:49.516178+00', '2026-02-01 13:47:49.516178+00', '7c268525-c67b-46ff-a5d3-1c1944d80705'),
	('e40e90f2-a751-4539-b6af-281868ba9be9', 'e40e90f2-a751-4539-b6af-281868ba9be9', '{"sub": "e40e90f2-a751-4539-b6af-281868ba9be9", "email": "goncalopinto1@outlook.com", "email_verified": true, "phone_verified": false}', 'email', '2026-02-21 18:49:31.742863+00', '2026-02-21 18:49:31.743463+00', '2026-02-21 18:49:31.743463+00', '297dbf49-06fa-4f6c-81a9-dc2cc8559134'),
	('ad1e9ff4-1c1c-4f1e-8fc1-76665d84a7a0', 'ad1e9ff4-1c1c-4f1e-8fc1-76665d84a7a0', '{"sub": "ad1e9ff4-1c1c-4f1e-8fc1-76665d84a7a0", "email": "veramarta1993@hotmail.com", "email_verified": true, "phone_verified": false}', 'email', '2026-03-08 19:59:15.173673+00', '2026-03-08 19:59:15.173753+00', '2026-03-08 19:59:15.173753+00', '1fc1f226-ac27-4910-a8a9-29ff167f7dd8'),
	('c36bb5bc-273f-4f4a-85f2-2f03bebdd493', 'c36bb5bc-273f-4f4a-85f2-2f03bebdd493', '{"sub": "c36bb5bc-273f-4f4a-85f2-2f03bebdd493", "email": "hugosousa@gmx.ch", "email_verified": true, "phone_verified": false}', 'email', '2026-03-15 16:21:37.181525+00', '2026-03-15 16:21:37.181578+00', '2026-03-15 16:21:37.181578+00', 'ea838ec9-854c-4049-b127-19a09e34713d'),
	('e3cb0ead-0e34-4190-abeb-bbaec9608372', 'e3cb0ead-0e34-4190-abeb-bbaec9608372', '{"sub": "e3cb0ead-0e34-4190-abeb-bbaec9608372", "email": "ricreizinho@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2026-03-22 19:18:02.039566+00', '2026-03-22 19:18:02.039622+00', '2026-03-22 19:18:02.039622+00', '4b60664a-dc38-4668-9b8b-e0dea41a03ed'),
	('105653747404720187983', '856884bf-4807-4747-93a6-3a239cc831e8', '{"iss": "https://accounts.google.com", "sub": "105653747404720187983", "name": "Paulo Reizinho", "email": "paulolopesreizinho@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocI0fmypygSdo_EZtLe0v06S78P7UPRwHqJO5HT5CdZqjc_8n3A=s96-c", "full_name": "Paulo Reizinho", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocI0fmypygSdo_EZtLe0v06S78P7UPRwHqJO5HT5CdZqjc_8n3A=s96-c", "provider_id": "105653747404720187983", "email_verified": true, "phone_verified": false}', 'google', '2026-03-22 20:14:50.676014+00', '2026-03-22 20:14:50.676067+00', '2026-03-22 20:14:50.676067+00', '812decc8-5628-46d4-8eff-b69d5684ef0e'),
	('31b164ed-276e-4ca5-afbd-a012127266bc', '31b164ed-276e-4ca5-afbd-a012127266bc', '{"sub": "31b164ed-276e-4ca5-afbd-a012127266bc", "email": "cansado.garage@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2026-03-29 20:27:42.578922+00', '2026-03-29 20:27:42.578993+00', '2026-03-29 20:27:42.578993+00', 'fb184217-2cc1-49d9-9cb7-ac58aab48515');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('45b8ed96-20b5-44f6-939a-8753eb337fbd', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', '2026-04-05 12:06:57.59234+00', '2026-04-05 12:06:57.59234+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '31.10.146.43', NULL, NULL, NULL, NULL, NULL),
	('f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d', 'e40e90f2-a751-4539-b6af-281868ba9be9', '2026-03-22 19:55:37.162058+00', '2026-04-05 12:27:33.596645+00', NULL, 'aal1', NULL, '2026-04-05 12:27:33.596548', 'node', '3.67.40.212', NULL, NULL, NULL, NULL, NULL),
	('63ee7329-a29c-4fb2-ad40-0eb149741c26', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', '2026-04-03 13:57:02.811625+00', '2026-04-04 08:37:10.996899+00', NULL, 'aal1', NULL, '2026-04-04 08:37:10.996801', 'node', '3.127.217.72', NULL, NULL, NULL, NULL, NULL),
	('a8646e20-3a3a-40a6-8a2b-6b04708ee7c5', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', '2026-04-02 08:44:57.303987+00', '2026-04-05 12:35:08.700168+00', NULL, 'aal1', NULL, '2026-04-05 12:35:08.69952', 'node', '3.67.40.212', NULL, NULL, NULL, NULL, NULL),
	('bae134a1-3b5a-469a-868a-a07a48288e53', 'e40e90f2-a751-4539-b6af-281868ba9be9', '2026-03-22 19:27:48.921628+00', '2026-03-22 19:27:48.921628+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Mobile/15E148 Safari/604.1', '194.230.148.171', NULL, NULL, NULL, NULL, NULL),
	('bd7a15cc-e55a-4c28-b1a9-fe2149d4aa2d', 'ad1e9ff4-1c1c-4f1e-8fc1-76665d84a7a0', '2026-03-08 20:06:47.224872+00', '2026-03-29 20:01:20.489537+00', NULL, 'aal1', NULL, '2026-03-29 20:01:20.489439', 'node', '3.69.26.85', NULL, NULL, NULL, NULL, NULL),
	('dfb01841-b940-42ff-91d9-87f61c977641', 'e40e90f2-a751-4539-b6af-281868ba9be9', '2026-03-28 21:22:13.954843+00', '2026-04-05 07:58:41.735706+00', NULL, 'aal1', NULL, '2026-04-05 07:58:41.735578', 'node', '3.70.232.199', NULL, NULL, NULL, NULL, NULL),
	('0daabe6c-6844-45b5-8b57-9c0ae536db48', '31b164ed-276e-4ca5-afbd-a012127266bc', '2026-03-29 20:35:05.409981+00', '2026-03-31 10:21:30.696467+00', NULL, 'aal1', NULL, '2026-03-31 10:21:30.696346', 'node', '63.177.237.68', NULL, NULL, NULL, NULL, NULL),
	('ea9a2209-4bc1-42b7-bd47-6e9c6ea0f817', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', '2026-04-01 22:41:20.929471+00', '2026-04-05 10:31:59.440392+00', NULL, 'aal1', NULL, '2026-04-05 10:31:59.440293', 'node', '18.184.69.172', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('dfb01841-b940-42ff-91d9-87f61c977641', '2026-03-28 21:22:14.027767+00', '2026-03-28 21:22:14.027767+00', 'password', '77664d3d-40b3-41a7-9c2e-9c934f837b15'),
	('0daabe6c-6844-45b5-8b57-9c0ae536db48', '2026-03-29 20:35:05.462548+00', '2026-03-29 20:35:05.462548+00', 'otp', '29d47945-f59c-4d4a-b176-8666f00d7056'),
	('ea9a2209-4bc1-42b7-bd47-6e9c6ea0f817', '2026-04-01 22:41:21.035007+00', '2026-04-01 22:41:21.035007+00', 'password', 'b9577f15-0955-422f-ae6d-1eabcb574424'),
	('a8646e20-3a3a-40a6-8a2b-6b04708ee7c5', '2026-04-02 08:44:57.345829+00', '2026-04-02 08:44:57.345829+00', 'password', 'cbf06fd3-5e89-470d-9430-1157c3185e85'),
	('63ee7329-a29c-4fb2-ad40-0eb149741c26', '2026-04-03 13:57:02.855498+00', '2026-04-03 13:57:02.855498+00', 'password', '8cc9cac3-0ccc-48cc-9dc8-52409b87df25'),
	('45b8ed96-20b5-44f6-939a-8753eb337fbd', '2026-04-05 12:06:57.663036+00', '2026-04-05 12:06:57.663036+00', 'password', '0bfd0bf0-cdf8-44aa-b159-a3e40bebe2fb'),
	('bd7a15cc-e55a-4c28-b1a9-fe2149d4aa2d', '2026-03-08 20:06:47.236969+00', '2026-03-08 20:06:47.236969+00', 'password', 'fcceef8c-428f-48e8-8d8c-e93bcdce97ae'),
	('bae134a1-3b5a-469a-868a-a07a48288e53', '2026-03-22 19:27:48.930169+00', '2026-03-22 19:27:48.930169+00', 'otp', '8952ff80-e88d-4429-93dc-3a56098dba23'),
	('f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d', '2026-03-22 19:55:37.21999+00', '2026-03-22 19:55:37.21999+00', 'password', '9193970f-a41e-414a-bf83-abe304abdad0');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 431, 'axzlvbum3upm', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 09:58:05.85732+00', '2026-04-04 10:57:05.804223+00', 'ia55rabklzwe', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 342, 'd5mkegx7tx6j', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-01 07:07:44.354229+00', '2026-04-02 07:15:03.501425+00', 'ss2o4mkanxxx', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 409, 'kjwhoh66csfe', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 15:33:04.127536+00', '2026-04-04 11:25:15.131342+00', 'yqtjxexbepj7', 'ea9a2209-4bc1-42b7-bd47-6e9c6ea0f817'),
	('00000000-0000-0000-0000-000000000000', 364, '25tbjlo2pkmc', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-02 07:15:03.532675+00', '2026-04-02 08:51:32.939209+00', 'd5mkegx7tx6j', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 432, 'l7hmsmimbevt', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 10:57:05.831827+00', '2026-04-04 11:56:05.663274+00', 'axzlvbum3upm', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 367, '5yaijccxbc3a', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 08:44:57.331217+00', '2026-04-02 09:43:37.283582+00', NULL, 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 433, '264bdopxfect', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 11:25:15.146517+00', '2026-04-04 16:27:13.216533+00', 'kjwhoh66csfe', 'ea9a2209-4bc1-42b7-bd47-6e9c6ea0f817'),
	('00000000-0000-0000-0000-000000000000', 371, 'yhwerbpgagyp', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 10:42:10.437074+00', '2026-04-02 11:41:10.025128+00', 'vhdhx3jivwm4', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 414, '4bqmtzdra4fo', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-03 18:20:40.532085+00', '2026-04-04 16:45:33.775631+00', 'dio5hlgyx26m', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 229, '252el2brlyyc', 'e40e90f2-a751-4539-b6af-281868ba9be9', false, '2026-03-22 19:27:48.924652+00', '2026-03-22 19:27:48.924652+00', NULL, 'bae134a1-3b5a-469a-868a-a07a48288e53'),
	('00000000-0000-0000-0000-000000000000', 374, 'ygkujhebal2i', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 13:39:10.085833+00', '2026-04-02 14:38:09.837981+00', 'u662bto4cg37', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 376, '3ejcnepk5llg', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 15:37:09.853991+00', '2026-04-02 16:36:09.598576+00', 'q2z7clyfbevg', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 257, 'bmebfw3vquta', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-25 17:06:50.337686+00', '2026-03-25 18:06:07.034384+00', 'l2vnjpvbrep2', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 380, 'qf44lc3i7bc7', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 19:33:09.329212+00', '2026-04-02 20:32:09.62966+00', 'fxytpz27a376', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 382, 'ncu4kzz4erub', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 21:31:09.174565+00', '2026-04-02 22:30:09.201631+00', 'zafmderr5y4c', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 386, 'yyqotiu26qwn', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 01:27:08.750189+00', '2026-04-03 02:26:08.562969+00', 'qtfsy3bgahfx', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 387, 'o62b3hag4xi5', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 02:26:08.586672+00', '2026-04-03 03:25:08.674743+00', 'yyqotiu26qwn', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 388, 'i6dbame3ed4y', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 03:25:08.70044+00', '2026-04-03 04:24:08.434607+00', 'o62b3hag4xi5', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 266, 'i23vewxolzoh', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-28 16:58:09.055104+00', '2026-03-28 17:57:00.776922+00', 'l3xderov4xfp', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 291, 'q3cprifaq5hn', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-29 08:34:21.539841+00', '2026-03-29 13:02:36.907434+00', 'nhpiguxmj4yz', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 389, 'n2jstt4h4rtn', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 04:24:08.461211+00', '2026-04-03 05:23:08.298598+00', 'i6dbame3ed4y', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 135, 'qsdbfgkyz7os', 'ad1e9ff4-1c1c-4f1e-8fc1-76665d84a7a0', true, '2026-03-08 20:06:47.235639+00', '2026-03-15 19:38:47.670059+00', NULL, 'bd7a15cc-e55a-4c28-b1a9-fe2149d4aa2d'),
	('00000000-0000-0000-0000-000000000000', 369, 'rgjcen45nnch', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 09:10:51.371829+00', '2026-04-03 10:57:39.396561+00', '4g6diwnbniaw', 'ea9a2209-4bc1-42b7-bd47-6e9c6ea0f817'),
	('00000000-0000-0000-0000-000000000000', 396, 'jq5uh5wjljgw', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-03 10:10:40.077971+00', '2026-04-03 11:09:54.196192+00', 'kb3ibrtz6h4m', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 397, 'o456i7765fup', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 10:18:07.738693+00', '2026-04-03 11:17:02.717118+00', 'bpdmaenlpoh3', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 399, 'dm7e5nammriw', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-03 11:09:54.212886+00', '2026-04-03 12:29:01.329706+00', 'jq5uh5wjljgw', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 401, '6vhooromen4o', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 12:16:07.918241+00', '2026-04-03 13:15:07.676038+00', '2nub4rod74qy', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 403, 'ph6cuggpinlh', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 13:15:07.694047+00', '2026-04-03 14:14:07.622979+00', '6vhooromen4o', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 407, 'uxrkhfkolrxb', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 14:14:07.656479+00', '2026-04-03 15:13:07.554256+00', 'ph6cuggpinlh', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 308, 'fqrtnpzzev35', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-29 19:52:15.138119+00', '2026-03-29 20:54:29.051398+00', '2degjfm47sob', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 405, 'yqtjxexbepj7', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 13:44:05.714271+00', '2026-04-03 15:33:04.103165+00', 'scp5tutfwbhz', 'ea9a2209-4bc1-42b7-bd47-6e9c6ea0f817'),
	('00000000-0000-0000-0000-000000000000', 411, 'dhppcxu72fns', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 16:16:10.263467+00', '2026-04-03 17:15:07.491886+00', 'wkp75f436ezn', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 413, 'coj5gnikrztu', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 18:14:07.44703+00', '2026-04-03 19:13:07.254534+00', 'qziaxwicyeon', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 319, 'i2vuxxojstwq', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-30 05:44:00.423537+00', '2026-03-30 13:29:03.094739+00', '54dzj77fmtqv', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 416, 'xvdfod5u77ds', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 20:12:07.610402+00', '2026-04-03 21:11:07.181376+00', 'ilcrgv4om6je', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 323, 'iagyvsug5xsf', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-30 13:29:03.112244+00', '2026-03-30 18:21:50.282766+00', 'i2vuxxojstwq', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 418, 'nyy7c6ziexg4', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 22:10:06.917062+00', '2026-04-03 23:09:06.744075+00', 'wvbh3gznjkhz', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 325, 'ywthtcj2yskj', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-30 18:21:50.306467+00', '2026-03-31 10:17:59.642994+00', 'iagyvsug5xsf', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 419, 'odtsc5sz42aq', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 23:09:06.766566+00', '2026-04-04 00:08:06.924652+00', 'nyy7c6ziexg4', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 420, 'voz2lk52pgon', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 00:08:06.95306+00', '2026-04-04 01:07:06.575836+00', 'odtsc5sz42aq', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 421, 'unrx3vbnxael', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 01:07:06.597311+00', '2026-04-04 02:06:06.495627+00', 'voz2lk52pgon', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 422, 'yypiua2272zq', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 02:06:06.517138+00', '2026-04-04 03:05:06.649132+00', 'unrx3vbnxael', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 423, 'yom56oj73jug', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 03:05:06.670547+00', '2026-04-04 04:04:06.32636+00', 'yypiua2272zq', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 424, 'iamh7gxhiqcy', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 04:04:06.34093+00', '2026-04-04 05:03:06.162766+00', 'yom56oj73jug', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 425, 'oun4y75lde3q', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 05:03:06.185771+00', '2026-04-04 06:02:06.284806+00', 'iamh7gxhiqcy', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 426, 'pdgsortgjzhh', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 06:02:06.312027+00', '2026-04-04 07:01:06.166008+00', 'oun4y75lde3q', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 427, 'pviezyuhfo64', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 07:01:06.198058+00', '2026-04-04 08:00:06.011368+00', 'pdgsortgjzhh', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 429, 'ed76xoyly2gh', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', false, '2026-04-04 08:37:10.956213+00', '2026-04-04 08:37:10.956213+00', 'ezlu6oeq5qfd', '63ee7329-a29c-4fb2-ad40-0eb149741c26'),
	('00000000-0000-0000-0000-000000000000', 428, 'pnsp2ok7iqjn', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 08:00:06.041606+00', '2026-04-04 08:59:06.959142+00', 'pviezyuhfo64', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 430, 'ia55rabklzwe', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 08:59:06.980579+00', '2026-04-04 09:58:05.818768+00', 'pnsp2ok7iqjn', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 271, 'p4zobnnghgxr', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-28 18:56:00.755901+00', '2026-03-28 19:54:33.763225+00', 'z4wn62pj7ie5', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 275, 'pd2fllvw7ego', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-28 19:54:33.785074+00', '2026-03-28 20:53:25.855137+00', 'p4zobnnghgxr', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 363, 'j47j2vztujlb', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-01 22:41:20.987226+00', '2026-04-02 07:52:01.915101+00', NULL, 'ea9a2209-4bc1-42b7-bd47-6e9c6ea0f817'),
	('00000000-0000-0000-0000-000000000000', 404, 'elxuxcbz2ep6', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-03 13:27:17.889047+00', '2026-04-04 13:07:08.984371+00', 'huysr4ucba3q', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 328, 'tnogwfcctg24', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-31 10:17:59.680363+00', '2026-03-31 18:48:53.583365+00', 'ywthtcj2yskj', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 365, '4g6diwnbniaw', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 07:52:01.951284+00', '2026-04-02 09:10:51.346813+00', 'j47j2vztujlb', 'ea9a2209-4bc1-42b7-bd47-6e9c6ea0f817'),
	('00000000-0000-0000-0000-000000000000', 370, 'vhdhx3jivwm4', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 09:43:37.30649+00', '2026-04-02 10:42:10.404394+00', '5yaijccxbc3a', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 339, 'ss2o4mkanxxx', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-31 18:48:53.616833+00', '2026-04-01 07:07:44.33051+00', 'tnogwfcctg24', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 372, 'z35elfuccfzi', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 11:41:10.054525+00', '2026-04-02 12:40:09.932344+00', 'yhwerbpgagyp', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 373, 'u662bto4cg37', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 12:40:09.954855+00', '2026-04-02 13:39:10.051129+00', 'z35elfuccfzi', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 279, 'nhpiguxmj4yz', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-28 21:22:13.9898+00', '2026-03-29 08:34:21.512875+00', NULL, 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 375, 'q2z7clyfbevg', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 14:38:09.871129+00', '2026-04-02 15:37:09.814203+00', 'ygkujhebal2i', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 230, 'l2vnjpvbrep2', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-22 19:55:37.196127+00', '2026-03-25 17:06:50.304385+00', NULL, 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 377, '7d7bbygtjaja', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 16:36:09.628689+00', '2026-04-02 17:35:09.798301+00', '3ejcnepk5llg', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 378, 'vc4jqs5yanju', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 17:35:09.825239+00', '2026-04-02 18:34:09.324435+00', '7d7bbygtjaja', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 379, 'fxytpz27a376', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 18:34:09.357481+00', '2026-04-02 19:33:09.302557+00', 'vc4jqs5yanju', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 258, 'yg3smdfrctu5', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-25 18:06:07.075302+00', '2026-03-28 09:53:37.022676+00', 'bmebfw3vquta', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 277, '5dpr5y4b3scg', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-28 20:53:25.887263+00', '2026-03-29 16:34:09.961203+00', 'pd2fllvw7ego', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 381, 'zafmderr5y4c', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 20:32:09.664271+00', '2026-04-02 21:31:09.138912+00', 'qf44lc3i7bc7', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 262, 'l3xderov4xfp', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-28 09:53:37.051469+00', '2026-03-28 16:58:09.002885+00', 'yg3smdfrctu5', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 383, 'uqu67ohu6pvi', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 22:30:09.233763+00', '2026-04-02 23:29:09.029044+00', 'ncu4kzz4erub', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 301, 'p5oevknacofa', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-29 16:34:09.991187+00', '2026-03-29 17:32:57.744265+00', '5dpr5y4b3scg', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 268, 'z4wn62pj7ie5', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-28 17:57:00.808635+00', '2026-03-28 18:56:00.740433+00', 'i23vewxolzoh', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 384, '5nmogyi2rfgp', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-02 23:29:09.048133+00', '2026-04-03 00:28:08.750626+00', 'uqu67ohu6pvi', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 303, '2qibvwwlez47', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-29 17:32:57.763369+00', '2026-03-29 18:31:46.456454+00', 'p5oevknacofa', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 385, 'qtfsy3bgahfx', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 00:28:08.769853+00', '2026-04-03 01:27:08.720194+00', '5nmogyi2rfgp', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 297, '2degjfm47sob', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-29 13:02:36.929934+00', '2026-03-29 19:52:15.124374+00', 'q3cprifaq5hn', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 197, '7ny5lsdwugfp', 'ad1e9ff4-1c1c-4f1e-8fc1-76665d84a7a0', true, '2026-03-15 19:38:47.670869+00', '2026-03-29 20:01:20.446788+00', 'qsdbfgkyz7os', 'bd7a15cc-e55a-4c28-b1a9-fe2149d4aa2d'),
	('00000000-0000-0000-0000-000000000000', 309, 'oefqc4t5xhix', 'ad1e9ff4-1c1c-4f1e-8fc1-76665d84a7a0', false, '2026-03-29 20:01:20.467783+00', '2026-03-29 20:01:20.467783+00', '7ny5lsdwugfp', 'bd7a15cc-e55a-4c28-b1a9-fe2149d4aa2d'),
	('00000000-0000-0000-0000-000000000000', 390, 'r56vkazsj7p4', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 05:23:08.321434+00', '2026-04-03 06:22:08.367797+00', 'n2jstt4h4rtn', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 391, 'c3ddiek7475p', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 06:22:08.396882+00', '2026-04-03 07:21:08.599337+00', 'r56vkazsj7p4', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 368, 'xz4o35dzqbtf', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-02 08:51:32.951429+00', '2026-04-03 08:13:35.932791+00', '25tbjlo2pkmc', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 314, '54dzj77fmtqv', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-29 20:54:29.072816+00', '2026-03-30 05:44:00.408579+00', 'fqrtnpzzev35', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 392, '5luztwkm3lzb', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 07:21:08.620581+00', '2026-04-03 08:20:07.948289+00', 'c3ddiek7475p', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 312, 'vanwc6qmh2oy', '31b164ed-276e-4ca5-afbd-a012127266bc', true, '2026-03-29 20:35:05.426093+00', '2026-03-30 10:33:53.012739+00', NULL, '0daabe6c-6844-45b5-8b57-9c0ae536db48'),
	('00000000-0000-0000-0000-000000000000', 394, 'ubupbqjvfesp', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 08:20:07.966289+00', '2026-04-03 09:19:08.102935+00', '5luztwkm3lzb', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 305, 'kb3ibrtz6h4m', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-03-29 18:31:46.473353+00', '2026-04-03 10:10:40.055311+00', '2qibvwwlez47', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 395, 'bpdmaenlpoh3', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 09:19:08.131857+00', '2026-04-03 10:18:07.721393+00', 'ubupbqjvfesp', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 322, 'upb3ol6kfn5q', '31b164ed-276e-4ca5-afbd-a012127266bc', true, '2026-03-30 10:33:53.038135+00', '2026-03-31 10:21:30.619346+00', 'vanwc6qmh2oy', '0daabe6c-6844-45b5-8b57-9c0ae536db48'),
	('00000000-0000-0000-0000-000000000000', 329, 'ku47kiypw7xe', '31b164ed-276e-4ca5-afbd-a012127266bc', false, '2026-03-31 10:21:30.64474+00', '2026-03-31 10:21:30.64474+00', 'upb3ol6kfn5q', '0daabe6c-6844-45b5-8b57-9c0ae536db48'),
	('00000000-0000-0000-0000-000000000000', 400, '2nub4rod74qy', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 11:17:02.753325+00', '2026-04-03 12:16:07.901542+00', 'o456i7765fup', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 402, 'huysr4ucba3q', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-03 12:29:01.360499+00', '2026-04-03 13:27:17.86928+00', 'dm7e5nammriw', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 398, 'scp5tutfwbhz', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 10:57:39.42125+00', '2026-04-03 13:44:05.685703+00', 'rgjcen45nnch', 'ea9a2209-4bc1-42b7-bd47-6e9c6ea0f817'),
	('00000000-0000-0000-0000-000000000000', 393, 'zxgrdn64b3zg', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-03 08:13:35.95765+00', '2026-04-03 15:45:57.153973+00', 'xz4o35dzqbtf', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 408, 'wkp75f436ezn', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 15:13:07.584886+00', '2026-04-03 16:16:10.238871+00', 'uxrkhfkolrxb', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 412, 'qziaxwicyeon', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 17:15:07.538564+00', '2026-04-03 18:14:07.431531+00', 'dhppcxu72fns', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 410, 'dio5hlgyx26m', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-03 15:45:57.173607+00', '2026-04-03 18:20:40.528389+00', 'zxgrdn64b3zg', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 415, 'ilcrgv4om6je', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 19:13:07.303236+00', '2026-04-03 20:12:07.572864+00', 'coj5gnikrztu', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 417, 'wvbh3gznjkhz', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 21:11:07.229894+00', '2026-04-03 22:10:06.89521+00', 'xvdfod5u77ds', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 406, 'ezlu6oeq5qfd', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-03 13:57:02.83159+00', '2026-04-04 08:37:10.934511+00', NULL, '63ee7329-a29c-4fb2-ad40-0eb149741c26'),
	('00000000-0000-0000-0000-000000000000', 434, 'egbt6jv5yr75', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 11:56:05.705939+00', '2026-04-04 12:55:06.45486+00', 'l7hmsmimbevt', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 435, 'q3pk2xlvbgm5', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 12:55:06.493766+00', '2026-04-04 13:54:05.694083+00', 'egbt6jv5yr75', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 436, 'ziar7qb2ndfx', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-04 13:07:09.005066+00', '2026-04-04 14:05:49.163186+00', 'elxuxcbz2ep6', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 438, 'z7wcw4pcaf5y', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-04 14:05:49.19095+00', '2026-04-04 15:04:28.789087+00', 'ziar7qb2ndfx', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 437, 'uc3fdvjwm2cl', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 13:54:05.724308+00', '2026-04-04 15:12:05.844071+00', 'q3pk2xlvbgm5', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 439, '2h3x5lknjinv', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-04 15:04:28.810127+00', '2026-04-04 16:02:37.772039+00', 'z7wcw4pcaf5y', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 440, '5daxcdn7ezs5', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 15:12:05.856735+00', '2026-04-04 16:11:05.606337+00', 'uc3fdvjwm2cl', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 441, 'lgoual7x2727', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-04 16:02:37.797133+00', '2026-04-04 17:01:51.96523+00', '2h3x5lknjinv', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 442, 'z56va3ww2ret', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 16:11:05.624854+00', '2026-04-04 17:10:05.144225+00', '5daxcdn7ezs5', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 445, 'ggjsviwcjmrb', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-04 17:01:52.004657+00', '2026-04-04 18:00:51.901337+00', 'lgoual7x2727', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 446, 'cak6vaiw4uru', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 17:10:05.155944+00', '2026-04-04 18:10:06.607477+00', 'z56va3ww2ret', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 444, 'zx6gx3kihuzq', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-04 16:45:33.81276+00', '2026-04-04 18:22:05.847657+00', '4bqmtzdra4fo', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 447, 'oj6rp3kyxzpx', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-04 18:00:51.932039+00', '2026-04-04 18:59:04.543789+00', 'ggjsviwcjmrb', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 448, 'wzki46f55wpy', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 18:10:06.632267+00', '2026-04-04 19:08:39.075355+00', 'cak6vaiw4uru', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 450, 'jle6klgg3lnj', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-04 18:59:04.571386+00', '2026-04-04 19:57:51.953258+00', 'oj6rp3kyxzpx', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 451, 'xhdjtr353p5b', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 19:08:39.09925+00', '2026-04-04 20:08:07.755837+00', 'wzki46f55wpy', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 453, '5hi2hnztdq6b', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 20:08:07.780417+00', '2026-04-04 21:07:04.735251+00', 'xhdjtr353p5b', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 454, 'kzckzdo752ze', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 21:07:04.773035+00', '2026-04-04 22:06:04.677974+00', '5hi2hnztdq6b', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 455, 'utxeovcvlrun', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 22:06:04.717389+00', '2026-04-04 23:05:04.440661+00', 'kzckzdo752ze', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 456, 'r2t4fbbgvrwu', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 23:05:04.4597+00', '2026-04-05 00:04:04.474093+00', 'utxeovcvlrun', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 457, '3vk64akyrebf', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-05 00:04:04.508265+00', '2026-04-05 01:03:04.391145+00', 'r2t4fbbgvrwu', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 458, 'zeht25j32vwc', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-05 01:03:04.413448+00', '2026-04-05 02:02:04.414483+00', '3vk64akyrebf', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 452, 'n7i77zsmsjmu', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-04 19:57:51.978613+00', '2026-04-05 02:43:55.899501+00', 'jle6klgg3lnj', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 459, '2mrl4e4lneru', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-05 02:02:04.444302+00', '2026-04-05 03:01:04.306647+00', 'zeht25j32vwc', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 460, 'l6aj6eqegheb', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-05 02:43:55.923774+00', '2026-04-05 03:42:51.593926+00', 'n7i77zsmsjmu', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 461, 'ixuaq4dcsb5l', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-05 03:01:04.335993+00', '2026-04-05 04:00:04.119897+00', '2mrl4e4lneru', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 463, '5hqlodur6ukx', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-05 04:00:04.14595+00', '2026-04-05 04:59:04.070235+00', 'ixuaq4dcsb5l', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 464, 'xfmxddoqwoss', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-05 04:59:04.109113+00', '2026-04-05 05:58:03.821144+00', '5hqlodur6ukx', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 449, 'md3c2prxvkoy', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-04 18:22:05.86478+00', '2026-04-05 07:58:41.686854+00', 'zx6gx3kihuzq', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 466, 'ocsuxqrp4wfx', 'e40e90f2-a751-4539-b6af-281868ba9be9', false, '2026-04-05 07:58:41.708353+00', '2026-04-05 07:58:41.708353+00', 'md3c2prxvkoy', 'dfb01841-b940-42ff-91d9-87f61c977641'),
	('00000000-0000-0000-0000-000000000000', 462, 'rgjkqfvg4jjr', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-05 03:42:51.609423+00', '2026-04-05 09:22:16.548266+00', 'l6aj6eqegheb', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 465, 'kqnsxbbotceg', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-05 05:58:03.846645+00', '2026-04-05 09:38:36.014524+00', 'xfmxddoqwoss', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 467, '2eksucpj5rtg', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-05 09:22:16.568743+00', '2026-04-05 10:20:40.929878+00', 'rgjkqfvg4jjr', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 443, '5sa2fntg3tzo', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-04 16:27:13.247087+00', '2026-04-05 10:31:59.372531+00', '264bdopxfect', 'ea9a2209-4bc1-42b7-bd47-6e9c6ea0f817'),
	('00000000-0000-0000-0000-000000000000', 470, 'h6r5npndlpzp', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', false, '2026-04-05 10:31:59.399818+00', '2026-04-05 10:31:59.399818+00', '5sa2fntg3tzo', 'ea9a2209-4bc1-42b7-bd47-6e9c6ea0f817'),
	('00000000-0000-0000-0000-000000000000', 468, 'w5fjvpowopms', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-05 09:38:36.035452+00', '2026-04-05 10:37:30.057478+00', 'kqnsxbbotceg', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 469, 'xepsddv5k6hx', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-05 10:20:40.950525+00', '2026-04-05 11:20:30.708925+00', '2eksucpj5rtg', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 471, '7ngc5mlf5cco', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-05 10:37:30.072471+00', '2026-04-05 11:36:07.955203+00', 'w5fjvpowopms', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 474, 'nfuzsrtg356m', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', false, '2026-04-05 12:06:57.621699+00', '2026-04-05 12:06:57.621699+00', NULL, '45b8ed96-20b5-44f6-939a-8753eb337fbd'),
	('00000000-0000-0000-0000-000000000000', 472, 'wf2tjhtsjjgg', 'e40e90f2-a751-4539-b6af-281868ba9be9', true, '2026-04-05 11:20:30.732267+00', '2026-04-05 12:27:33.556242+00', 'xepsddv5k6hx', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 475, 'igxhoaoulnqi', 'e40e90f2-a751-4539-b6af-281868ba9be9', false, '2026-04-05 12:27:33.580669+00', '2026-04-05 12:27:33.580669+00', 'wf2tjhtsjjgg', 'f15d6a55-3f51-40bd-ba4c-7ed5078a1e1d'),
	('00000000-0000-0000-0000-000000000000', 473, 'w3j22v7nw272', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', true, '2026-04-05 11:36:07.98804+00', '2026-04-05 12:35:08.652767+00', '7ngc5mlf5cco', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5'),
	('00000000-0000-0000-0000-000000000000', 476, 'wyb6zzbzsssy', 'e6d6fa08-96a9-445c-bd5e-748baaad689d', false, '2026-04-05 12:35:08.67454+00', '2026-04-05 12:35:08.67454+00', 'w3j22v7nw272', 'a8646e20-3a3a-40a6-8a2b-6b04708ee7c5');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 476, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict FU6Caoubadyg3hVlycY2jyOsOIR6DC3gA8f9syl6tdq2dYySbpMy8h5L9ecooJe

RESET ALL;
