#!/bin/bash

set -euo pipefail

CONFIG_FILE=".github/ucdjs-apps.json"

read_apps_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        echo "Error: $CONFIG_FILE not found" >&2
        exit 1
    fi
    cat "$CONFIG_FILE"
}

list_apps() {
    local apps_json
    apps_json=$(read_apps_config)

    # filter only deployable apps and output their names
    echo "$apps_json" | jq -r '.apps[] | select(.deployable == true) | .name'
}

generate_comment_table() {
    local apps_json
    apps_json=$(read_apps_config)

    local status
    if [[ "$INPUT_DRY_RUN" == "true" ]]; then
        status="⏸️ Dry Run"
    else
        status="⏳ In Progress"
    fi

    echo "| Application | Status | Preview URL |"
    echo "| ----------- | ------ | ----------- |"

    # generate table rows for each deployable app
    echo "$apps_json" | jq -r --arg status "$status" '
        .apps[] |
        select(.deployable == true) |
        "| \(.display_name) | \($status) | N/A |"
    '
}

process_deployment_results() {
    local apps_json
    apps_json=$(read_apps_config)

    # initialize results object
    local results="{}"

    # process each deployable app
    while IFS= read -r app_name; do
        local status="⏭️ Skipped"
        local url="N/A"
        local result_file="$INPUT_DEPLOYMENT_RESULTS_PATH/deployment-result-$app_name/deployment-result"

        if [[ -f "$result_file" ]]; then
            local app_result
            app_result=$(cat "$result_file")
            local app_status
            app_status=$(echo "$app_result" | jq -r '.status')
            local app_url
            app_url=$(echo "$app_result" | jq -r '.url')

            case "$app_status" in
                "deployed")
                    status="✅ Deployed"
                    url="[View Preview]($app_url)"
                    ;;
                "dry-run")
                    status="⏸️ Dry Run"
                    ;;
                "failed")
                    status="❌ Failed"
                    ;;
            esac
        fi

        # add to results
        results=$(echo "$results" | jq -c --arg app "$app_name" --arg status "$status" --arg url "$url" '
            .[$app] = {"status": $status, "url": $url}
        ')

        # set outputs for individual apps
        echo "${app_name}-status=$status" >> "$GITHUB_OUTPUT"
        echo "${app_name}-url=$url" >> "$GITHUB_OUTPUT"

    done < <(list_apps)

    # generate final comment table
    echo "| Application | Status | Preview URL |"
    echo "| ----------- | ------ | ----------- |"

    echo "$apps_json" | jq -r --argjson results "$results" '
        .apps[] |
        select(.deployable == true) |
        . as $app |
        $results[$app.name] as $result |
        "| \($app.display_name) | \($result.status) | \($result.url) |"
    ' | tee /tmp/comment_table

    # set outputs
    echo "deployment-results=$results" >> "$GITHUB_OUTPUT"
    {
        echo "comment-table<<EOF"
        cat /tmp/comment_table
        echo "EOF"
    } >> "$GITHUB_OUTPUT"
}

case "$INPUT_COMMAND" in
    "list-apps")
        apps_list=$(list_apps | jq -R -s -c 'split("\n") | map(select(. != ""))')
        echo "apps=$apps_list" >> "$GITHUB_OUTPUT"
        ;;
    "generate-comment-table")
        table=$(generate_comment_table)
        {
            echo "comment-table<<EOF"
            echo "$table"
            echo "EOF"
        } >> "$GITHUB_OUTPUT"
        ;;
    "process-deployment-results")
        process_deployment_results
        ;;
    *)
        echo "Error: Unknown command '$INPUT_COMMAND'" >&2
        echo "Available commands: list-apps, generate-comment-table, process-deployment-results" >&2
        exit 1
        ;;
esac
