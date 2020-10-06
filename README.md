# shybyte.github.com

## Install Jekyll

https://jekyllrb.com/docs/installation/ubuntu/

```bash
echo '# Install Ruby Gems to ~/gems' >> ~/.zshenv 
echo 'export GEM_HOME="$HOME/gems"' >> ~/.zshenv 
echo 'export PATH="$HOME/gems/bin:$PATH"' >> ~/.zshenv 

sudo apt-get install ruby-full build-essential zlib1g-dev
gem install jekyll bundler
```

## Run Locally

https://docs.github.com/en/free-pro-team@latest/github/working-with-github-pages/testing-your-github-pages-site-locally-with-jekyll

    bundle exec jekyll serve
    
## Some Jekyll Links

* https://github.com/jekyll/minima
* http://longqian.me/2017/02/09/github-jekyll-tag/    
