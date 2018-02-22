
if (env.BRANCH_NAME == 'master') {

    node('docker') {
        stage('Checkout') {
            // clean git clone, but don't fail in case it doesn't exist yet
            sh(script: 'git clean -x -d -f', returnStatus: true)
            checkout scm
        }
        // TODO: we should do some package verification here?
        def img = docker.image('hub.bccvl.org.au/bccvl/python_node:2')
        docker.withRegistry('https://hub.bccvl.org.au', 'hub.bccvl.org.au') {
            img.inside() {
                stage('Package') {
                    if (publishPackage(currentBuild.result, env.BRANCH_NAME)) {
                        withVirtualenv() {
                            sh 'rm -fr build dist'
                            sh '${VIRTUALENV}/bin/python setup.py build'
                            sh '${VIRTUALENV}/bin/python setup.py register -r devpi sdist bdist_wheel upload -r devpi'
                        }
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
