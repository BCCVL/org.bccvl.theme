
if (env.BRANCH_NAME == 'master') {

    node('docker') {
        stage('Checkout') {
            // clean git clone, but don't fail in case it doesn't exist yet
            sh(script: 'git clean -x -d -f', returnStatus: true)
            checkout scm
        }
        // TODO: we should do some package verification here?
        def img = docker.image('python:2')
        img.inside() {
            stage('Package') {
                if (publishPackage(currentBuild.result, env.BRANCH_NAME)) {
                    // install nodejs to build wheel
                    sh 'curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -'
                    sh 'sudo apt-get install -y nodejs'
                    // build and publish wheel
                    withVirtualenv() {
                        sh 'rm -fr build dist'
                        sh '${VIRTUALENV}/bin/python setup.py register -r devpi sdist bdist_wheel upload -r devpi'
                    }
                }
            }
        }
    }

} else {

    def downstream = build(
        job: "../bccvl_buildout/${java.net.URLEncoder.encode(env.BRANCH_NAME)}",
        wait: true,
        propagate: true
    )

}
