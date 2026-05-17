# Plan d'implémentation - Yonnee v2

Périmètre énorme. Je propose de découper en **3 lots livrables** pour garder de la qualité. Validez l'ordre puis j'exécute lot par lot.

## Lot 1 — Fondations UX & comptes (PRIORITÉ)

**1.1 Récupération mot de passe**
- Page `/forgot-password` : `supabase.auth.resetPasswordForEmail`
- Page `/reset-password` : `supabase.auth.updateUser({ password })`
- Lien depuis `/login`

**1.2 Barres de menus dédiées par rôle (5 footers distincts)**
Supprimer le BottomNav unique et le "dashboard" fourre-tout. Chaque rôle a ses propres onglets visibles dans le footer :

```
Client       : Accueil · Rechercher · Mes colis · Notifs · Profil
Commerçant   : Accueil · Catalogue · Commandes · Stats · Profil
Fournisseur  : Accueil · Stock · Demandes · Stats · Profil
GP Standard  : Accueil · Mes annonces · Réservations · Scan · Profil
GP Express   : Accueil · Annonces express · Courses live · Scan · Profil
Admin        : Vue d'ensemble · Utilisateurs · GP à valider · Transactions · Annonces
```

- Layout `_authenticated.tsx` qui lit le rôle et monte le bon `<RoleNav />`
- Chaque écran "Accueil" affiche stats + actions propres au rôle (pas un dashboard générique)
- Suppression de la route `/dashboard` unique

**1.3 Langue (FR/EN) auto-détectée par pays**
- Colonne `profiles.locale` (`fr`/`en`)
- À l'inscription : auto = `en` si pays anglophone, sinon `fr`
- Toggle dans `/profile`
- Petit i18n maison via dictionnaire (pas de lib lourde)

**1.4 Fix bugs navigation**
- Audit des liens cassés (`/dashboard`, routes manquantes par rôle)
- Garde-fous beforeLoad sur `_authenticated`

## Lot 2 — Annonces, tri & realtime

**2.1 Tri annonces**
Liste `/search` triée :
1. `departure_date ASC` (plus proche en premier)
2. Puis distance GPS (Haversine) entre user.lat/lng et `from_lat/from_lng`
3. Filtres : pays départ, pays arrivée, mode (standard/express), date

**2.2 Tracking realtime carte**
- Page `/tracking/$reservationId` avec **Leaflet + OpenStreetMap** (gratuit, pas de clé)
- Subscribe Supabase Realtime sur `gp_locations` filtré par `reservation_id`
- Marker GP qui bouge en live + polyline trajet + ETA Haversine / 60 km/h
- Côté GP : bouton "Partager ma position" qui insère toutes les 15s dans `gp_locations`

**2.3 Scan QR ↔ BDD**
- `/scan` lit le `code` de réservation, vérifie en DB (`reservations.code`)
- Workflow : `paid` → `picked_up` → `in_transit` → `arrived` → `delivered`
- Statuts annulation : `cancelled` / `refunded` (remboursement wallet immédiat)
- Insert `notifications` à chaque transition (client + GP)

## Lot 3 — Paiements & Admin

**3.1 Paiements Stripe (carte)**
- Activer Stripe payments managé Lovable
- Server function `createCheckoutSession` qui crée la réservation `pending` puis renvoie l'URL Stripe
- Server route webhook `/api/public/stripe-webhook` qui passe la résa en `paid` + débloque `gp_id` côté client
- Coordonnées GP masquées tant que `payments.status != 'succeeded'`

**3.2 Wave & Orange Money**
- UI prête (déjà OK), tables OK
- Workflow manuel : client envoie ref, GP confirme réception via bouton, statut passe `paid`
- Vrais APIs (Wave Business, OM API) nécessitent comptes pro → ajout secrets quand dispo. Je documente le hook prêt à recevoir.

**3.3 Dashboard admin complet (`/admin/*`)**
- Vue d'ensemble : KPIs (users, résas, GMV, paiements en attente)
- `/admin/users` : liste, recherche, ban/unban, changer rôle
- `/admin/gp` : GP en attente de vérif, prévisualisation docs (signed URL bucket privé), bouton valider/rejeter avec motif
- `/admin/reservations` : toutes les résas, filtres statut, forcer refund
- `/admin/transactions` : tous les paiements + payouts
- `/admin/announcements` : modération annonces (désactiver)
- Protection : `has_role(uid, 'admin')` + redirect si non admin
- Bouton "Promouvoir admin" via SQL initial (1er admin manuel)

## Détails techniques

- **i18n** : `src/lib/i18n.ts` avec hook `useT()` lisant `profile.locale`, dico FR/EN par clés
- **Leaflet** : `bun add leaflet react-leaflet @types/leaflet`
- **Realtime GP** : `supabase.channel('rt-loc').on('postgres_changes', ...)`
- **Migration SQL** ajoutant : `profiles.locale`, `profiles.is_banned`, fonction `get_distance_km(lat1,lng1,lat2,lng2)`, vue `admin_kpis`
- **Stripe** : intégration managée Lovable (pas besoin de compte Stripe utilisateur)

## Ordre d'exécution proposé

Je propose d'**enchaîner les 3 lots** dans cette session si vous validez, en commençant par Lot 1 (qui fixe les bugs bloquants), puis Lot 2, puis Lot 3. Chaque lot fait un point intermédiaire.

**Confirmez-vous ce plan et cet ordre ? (ou voulez-vous prioriser un lot ?)**
