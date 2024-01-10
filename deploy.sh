show_error() {
  for i in {1..15}; do
    echo YOU DIDN\'T SAY THE MAGIC WORD!
  done

  echo ":) 🦖 https://www.youtube.com/watch?v=RfiQYRn7fBg"
}

main() {
  echo -e "What environment are you deploying to? 🤔\n"
  options=("Production (async-v50)" "Staging (async-2-staging)")
  projects=("async-v50" "async-2-staging")
  configs=("app_prod.yaml" "app_staging.yaml")

  for i in "${!options[@]}"; do
    echo " $i) ${options[$i]}"
  done

  echo
  read -p ">>> " selection

  project="${projects[$selection]}"

  echo -e "\n Project: $project"
  echo -e " Branch: $(git branch --show-current)\n"

  read -p ">>> Y/n: " confirmation

  if [ "$confirmation" == "Y" ]; then
    echo "Deploying to $project! 🎉"
    gcloud config set project $project
    gcloud config list

    # This does NOT write a specific version (--version v1), so after deploying to production,
    # be sure to specifically stop old versions of the app:
    # https://console.developers.google.com/appengine/versions?project=async-2
    gcloud app deploy ${configs[$selection]}
  else
    show_error
  fi
}

main
