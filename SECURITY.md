# Politique de Sécurité — TSR TRANSIT Burkina Faso

Dernière mise à jour : 15 Octobre 2026  
Statut : **En vigueur (Préproduction certifiée Phase 8.1)**

---

## 1. Versions Prises en Charge

Nous assurons le support de sécurité et le déploiement continu des correctifs pour les versions actives de la plateforme TSR TRANSIT :

| Version | Statut | Mises à jour de sécurité |
| :--- | :--- | :--- |
| **8.1.x (Actuelle)** | :white_check_mark: Support Actif | Correctifs immédiats et surveillance 24/7 |
| 8.0.x | :white_check_mark: Support de Transition | Correctifs critiques uniquement |
| < 8.0 | :x: Obsolète | Fin de support (migration obligatoire) |

---

## 2. Piliers d'Architecture de Sécurité

La plateforme TSR TRANSIT intègre des garde-fous stricts appliqués côté serveur et dans les règles de sécurité Firestore :

1. **Contrôle d'Accès Basé sur les Rôles et Attributs (RBAC/ABAC) :**
   - Rôles stricts : `TRAVELER`, `AGENT`, `COMPANY_ADMIN`, `SUPER_ADMIN`.
   - Refus par défaut (*Deny by Default*) dans les règles Firestore.
   - Isolation étanche multi-sociétés (cloisonnement des données entre transporteurs).

2. **Atomicité des Réservations & Verrouillage Sièges :**
   - Verrou temporaire autoritaire de 10 minutes (600s) pour prévenir tout surbooking.
   - Transactions Firestore garantissant l'atomicité et l'unicité de réservation d'un siège.

3. **Billetterie Électronique Sécurisée par QR Code HMAC-SHA256 :**
   - Signature cryptographique infalsifiable côté serveur.
   - Prévention absolue de la réutilisation et de l'attaque par rejeu (*Anti-Replay Quai*) avec bascule d'état irréversible à `USED`.
   - Clés secrètes HMAC strictement confinées au serveur backend (zéro exposition client).

4. **Transactions Financières Mobile Money :**
   - Commission contractuelle plateforme (2,5 %) calculée et scellée exclusivement côté serveur.
   - Idempotence des paiements et vérification cryptographique des webhooks fournisseurs (Orange Money, Moov Money, Wave).

5. **Protection Anti-Brute-Force Fret & Colis (OTP) :**
   - Expiration temporelle de l'OTP de retrait.
   - Verrouillage automatique irréversible du colis après 3 échecs consécutifs (`COLIS_VERROUILLE`).

6. **Journal d'Audit Inaltérable & Confidentialité :**
   - Masquage systématique des données sensibles (codes PIN, secrets, identifiants de paiement).
   - Registre d'audit append-only sans API d'édition ni de suppression.

---

## 3. Signalement d'une Vulnérabilité

Si vous découvrez une faille de sécurité ou une vulnérabilité potentielle dans TSR TRANSIT, nous vous remercions de suivre notre processus de divulgation coordonnée :

### Contact Sécurité
- **E-mail direct :** `yameogojp2@gmail.com` / `security@tsrtransit.bf`
- **Canal de transmission :** Veuillez chiffrer vos messages sensibles ou fournir un résumé technique détaillé (étapes de reproduction, charge utile minimale, impact estimé).

### Règles d'Engagement
- **Confidentialité responsable :** Ne divulguez pas publiquement la vulnérabilité avant qu'un correctif n'ait été déployé et validé.
- **Aucune action destructive :** Ne tentez pas d'accéder aux données d'autrui, de modifier des données de production ou de perturber la disponibilité des services (DoS/DDoS).

### Délais de Réponse (SLA)
- **Accusé de réception :** Sous 24 heures ouvrées.
- **Triage & Évaluation d'impact :** Sous 48 heures.
- **Déploiement du correctif :**
  - Vulnérabilité **Critique** : Sous 24 à 48 heures.
  - Vulnérabilité **Élevée** : Sous 5 jours ouvrés.
  - Vulnérabilité **Moyenne / Faible** : Prochaine itération de maintenance.

---

## 4. Périmètre (Scope)

### En Périmètre (In-Scope)
- Authentification et contournement de rôles (RBAC/ABAC).
- Falsification ou altération de billets QR ou de signatures HMAC.
- Manipulation de tarifs de réservation ou de commissions.
- Fuite de données privées entre compagnies ou voyageurs.
- Évasion de contrôle d'accès dans les règles Firestore.

### Hors Périmètre (Out-of-Scope)
- Attaques par déni de service volumétrique (DDoS).
- Ingénierie sociale ou hameçonnage ciblant le personnel d'agence.
- Problèmes liés à des appareils utilisateurs non sécurisés (terminaux rootés/jailbreakés).
