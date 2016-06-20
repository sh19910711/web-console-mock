require 'web_console/testing/erb_precompiler'

EXPANDED_CWD = File.expand_path(File.dirname(__FILE__))

spec = Gem::Specification.find_by_name 'web-console'
load "#{spec.gem_dir}/lib/web_console/tasks/extensions.rake"

directory 'public/js'

task :build => ['ext:lib:templates', 'public/js'] do
  cp Pathname(spec.gem_dir).join('tmp/lib/console.js'), 'public/js/console.js'
end

task :patch do
  patchdir = Pathname(File.expand_path(File.join(__FILE__, '../patch')))
  cd spec.gem_dir do
    Pathname.glob(patchdir.join('*.patch')) do |p|
      sh "git am --abort || exit 0"
      sh "git am -3 #{p}"
    end
  end
end
