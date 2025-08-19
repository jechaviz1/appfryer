# Changelog
## 1.0.13, 2025.05.19
- Small fixes (reload meta data on app startup)
- Fixes for Push notifications

## 1.0.12, 2025.04.21
- Create recipe: Create new categories and tags
- Onboarding: Slides obtains from backend

## 1.0.11, 2025.04.18
- Create recipe: on finish step displays the popup
- Disable rotation for iPads

## 1.0.10, 2025.04.17
- IOS: Login: add Apple log in button

## 1.0.9, 2025.04.11
- Recipe share button
- Open app with link like `appfryer://recipe/1`
- Create recipe: filters for categories and tags
### Small changes
- Fix: when you select ingredients sometimes it does not select it (have to select it twice)

## 1.0.8, 2025.04.03
- Quiz: moved from My space to Home
- Quiz: display recipes; reset results on banner click
- Profile: add button 'Create new recipe'
- Create recipe: steps; add 'Cancel' button
- News screen
- Remove from Home filters, tabs and recipes
- Add 'Change languages' on Login and Sign up screens
- Log out: change language to default (es)
- Static pages use languages
### Small changes
- Fix: state of language on start app
- Translations: exclude measures

## 1.0.7, 2025.03.30
- Videos: play when showing, stop when on edges of display
- Settings: Language: add button 'Apply changes'
- Disable to create new recipes for not creators
- Hide: Stories, Diets, Seasonal, Fridge ingredients
- Home: hide Follow/Unfollow *only for not creators*
- Profile: Hide stats and recipes for not creators
### Small changes
- Filters: swap Prep time and Rating
- Fix: on open app update user data from backend

## 1.0.6, 2025.03.25
- Recipe card: on image click redirect to recipe screen
- Settings: display actual version
- Default language is Español
### Small changes
- Translate: Creating recipe steps
- Fix: Creating recipe: require at least one ingredient
- Fix: Creating recipe: storing media
- Fix: Creating recipe: instructions: get them if already exists
- Fix: Creating recipe: instructions: input fields with right colors

## 2025.03.21
- Recipe: show hierarchical comments
- On open sending app version to back end and display modal if update available (if it required, the modal is non closable)
### Small fixes
- Fix: Home, Explore, Profile: fetch info on focus screen
- Fix: Recipe without images; Folder cards
- Fix: Recipe of month: title right margin

## 2025.03.18
### Small changes
- Fix: Recipe: change 'Get Premium!' to 'Coming soon!' for non premium users
- Fix: Notifications: vertical offsets on links
- Fix: Recipe: plan meal modal offsets and use ScrollView for small displays

## 2025.03.17
- Settings: Delete account screen
### Small changes
- Settings: Notifications: check is email verified and on push-token exists
- Settings: hide Premium section
- Fix: Home/feeds: only one video play simulataneously
- Fix: Recipe, Ingredient: tabs have own height
- Fix: Profile: size of recipe cards
- Fix: delay on render a new screen
- Fix: don't redirect to profiles of removed/inactive users

## 2025.03.13
- Ingredient: add description, country, season, culinaryUse
- Badges: on feeds and on Recipe screen
- Settings: rate app
- Notifications: add planned meal with link to the needed day
### Small changes
- Removed Google and Facebook buttons on Login and Sign Up screens
- Fix: Sign Up: button Sign Up in the bottom of screen
- Fix: tap on Recipe of Month redirects to recipe
- Fix: Recipe: use correct 'Recipes of month'
- Fix: My space: fetch right Weekly plan
- Fix: auth fields on small screens

## 2025.02.28
- Home: Notifications from back end
- Explore: display search results
### Small changes
- Fix: Filters: crash on search ingredient
- Use requests for Home tabs and on Explore screen: 'Recipes for you' and 'Recipes of month'
- Explore: hide Achivements and Challenges

## 2025.02.27
- Folders editing: rename and delete
- Settings: Languages page
- Translations for all app screens; if it's missing, used the English variant
### Small changes
- Fix: save/unsave: on create folder, mark it immediately; on unsave the recipe clean it from the folders
- Fix: My space: recipe card width
- Fix: My space: update saved list on show tab
- Fix (mostly on iOS): scroll with low positioned input fields
- Fix: open folder feed from Recipe screen
- Fix: correct display folders in popup from Recipe screen

## 2025.02.14
- Settings: Notifications
- Notifications: mobile set up the notifications using the Google Firebase Cloud Messaging
- Folders for saved recipes
- My space: display folders in popup (on tap 'See all')
### Small changes
- Fix: Recipe card & User list: display placeholder image it user have not avatar
- Fix: on feed follow/unfollow affects only one recipe
- Add: Profile: display interactions (likes, comments)
- Comment: on tap the user image or name go to profile screen

## 2025.01.27
- Follow/Unfollow
- Profile: Integration the counts of recipes/follower/following
- Profile screen for other user
- Recipe: Macros: Calculate new values
- Recipe: Macros: save changes locally
### Small changes
- Activity log: add shopping list actions
- Fix: display nutrients for Ingredient screen
- Fix: registration process: choose preferences items

## 2025.01.17
- Shopping list screen: integration
- My space, Shopping list: manually add ingredient
### Small changes
- Activity log: add weekly meal records

## 2025.01.10
- Integration nutrient info for
    - Recipe and
    - Ingredient screens
- Nutrients: display only for premium users
- Recipe: Weekly plan: add date choosing
- Create recipe: use measures from backend
- Weekly plan: add date picker, API integration
### Small changes: 
- Back button for Sign up screen
- Right Terms and Condition screen from Sign up
- Recipe: top image changing

## 2025.01.03
- Settings: Premium badge and screen
- Update app logo
- Badge display: brief recipe cards in feeds, and in recipe screen
- Settings: add Dark mode changing

## 2024.12.27
- Search by title
- Settings: Activity log
- Static pages: About, Terms, Updates (fetches from backend every 24 hours)
- Filter by Diets (use collapsable view)
- My space: Weekly plan screen
- Recipe screen: calendar button shows modal with choosing the type of meal: breakfast/lunch/snack/dinner

## 2024.12.19
- Improvements for Create recipe steps:
    - don't send request to backend if nothing changes
    - block button 'Next' after click to not send double and more requests
- Fix: redirects to last recipe if from there open Category and try to open some recipe

## 2024.12.18
- Create recipe steps
- Editing draft recipes from Profile screen
- Display brief instructions on Recipe screen
- Start cooking fix scrolling
- Profile: show my recipes
- Display feed for diets
- Integrate recipe displaying with actual data

## 2024.12.04
- Recipe screen: display nutritional values for premium users
- Fix memory leak with using video component

## 2024.11.27

- Ingredient search for
    - Filters
    - Explore
    - My space, for Shopping list
- Home screen, filters works
- Explore screen: displays recipes from categories
- Screen with latest updates
- Small fixes
