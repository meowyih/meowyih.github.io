# Tool Link

https://meowyih.github.io/epic7-morale/index.html

localization

zh_tw:
https://meowyih.github.io/epic7-morale/index.html?lang=tw

# What is this?

This is a labyrinth morale tool for epic7. Actually, there are already several very good tools on internet. Most of them allow user to select several heroes as the team pool and generate the optimized team based on that pool. My tool uses different approach, which is to generate complete list based on all the heroes. It saves my time from trying different combinations.

# How it works?

1. Select 1 to 4 heroes that has to be in your team. 
2. Select some heroes that you does not to see in your team if you want. 
3. Press "calc" button.
4. Click '+' to expanse the list, and '-' to collapse.

# Data Source

All heroes' data was pulled from epic7 database api (https://epicsevendb.com/).

# How to update data?

Pull data using this tool https://meowyih.github.io/epic7-data/index.html and then copy the json to g_raw in data.js.

# Known issue

Epic7 database does not have Kikirat v2's camping information. So I simply remove it/him from the select list.
