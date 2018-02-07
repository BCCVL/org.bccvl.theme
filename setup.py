from distutils.cmd import Command
from distutils.command.build import build

from setuptools import setup, find_packages
from setuptools.command.develop import develop
from setuptools.command.install import install


class JSBuild(Command):

    description = "pre-compile js bundles"

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import os
        import subprocess
        kwargs = {
            'cwd': os.path.join(os.getcwd(), 'org/bccvl/theme/theme/html')
        }
        subprocess.check_call(["npm", "install"], **kwargs)
        subprocess.check_call(["npm", "run", "clean"], **kwargs)
        subprocess.check_call(["npm", "run", "build"], **kwargs)
        subprocess.check_call(["npm", "run", "cleandev"], **kwargs)


def wrap_js_build(command):

    class Command(command):
        def run(self):
            self.run_command('jsbuild')
            command.run(self)

    return Command


setup(
    name='org.bccvl.theme',
    setup_requires=['setuptools_scm'],
    use_scm_version=True,
    cmdclass={
        'build': wrap_js_build(build),
        'install': wrap_js_build(install),
        'develop': wrap_js_build(develop),
        'jsbuild': JSBuild,
    },
    description="BCCVL Diazo Theme",
    long_description=(open("README.rst").read() + "\n" +
                      open("CHANGELOG.rst").read()),
    # Get more strings from
    # http://pypi.python.org/pypi?:action=list_classifiers
    classifiers=[
        "Framework :: Plone",
        "Programming Language :: Python",
    ],
    keywords='',
    author='',
    author_email='',
    url='https://github.com/BCCVL/org.bccvl.theme/',
    license='GPL',
    packages=find_packages(),
    namespace_packages=['org', 'org.bccvl'],
    include_package_data=True,
    zip_safe=False,
    extras_require={
        'test': [
            'plone.app.robotframework',
        ]
    },
    install_requires=[
        'setuptools',
        'plone.app.theming',
        'plone.app.themingplugins',
        # TODO: why do I need to depend on this as it is required for theme
        # preview?
        'cssselect',
    ],
    entry_points={
        'z3c.autoinclude.plugin': [
            'target = plone'
        ]
    }
)
