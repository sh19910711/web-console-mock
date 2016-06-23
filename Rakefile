require 'web_console/testing/erb_precompiler'

EXPANDED_CWD = File.expand_path(File.dirname(__FILE__))
pwd = Pathname(EXPANDED_CWD)

spec = Gem::Specification.find_by_name 'web-console'
load "#{spec.gem_dir}/lib/web_console/tasks/extensions.rake"

directory 'public/js'

task :build => [:stash, :patch, 'ext:lib:templates', 'public/js', :copy, :stash_pop]

task :copy do
  cp Pathname(spec.gem_dir).join('tmp/lib/console.js'), pwd.join('public/js/console.js')
end

task :stash do
  cd spec.gem_dir { sh "git stash" }
end

task :stash_pop do
  cd spec.gem_dir { sh "git stash pop" }
end

task :patch do
  patchdir = Pathname(File.expand_path(File.join(__FILE__, '../patch')))
  cd spec.gem_dir do
    Pathname.glob(patchdir.join('*.patch')) do |p|
      sh "git am --abort || exit 0"
      sh "git am -3 #{p}"
      sh "git reset --hard HEAD~"
    end
  end
end
