import { NextStatelessComponent } from 'next'
import * as React from 'react'
import WorkflowEditor from '~/components/WorkflowEditor'

interface HomePageProps {
  value: string
}

const HomePage: NextStatelessComponent<HomePageProps> = ({ value }) => (
  <WorkflowEditor defaultValue={value} />
)

HomePage.displayName = 'HomePage'
HomePage.getInitialProps = async (): Promise<HomePageProps> => {
  return {
    value: `
workflow "New workflow" {
  on = "push"
}

action "Hello World" {
  needs = "New workflow"
  uses = "actions/npm"
  env = {
    MY_NAME = "Mona AHAH"
  }
  args = "\\"Hello, I'm $MY_NAME!\\""
}

action X {
  needs = B
  uses = "actions/npm"
  env = {
    MY_NAME = "Mon123123"
  }
  args = "\\"Hello , I'm $MY_NAME!\\""
}

action B {
  needs = "Hello World"
  uses = "actions/npm"
  env = {
    MY_NAME = "Monalisa"
  }
  args = "\\"Hello world, I'm $MY_NAME!\\""
}

action Y {
  needs = "Hello World"
  uses = "actions/npm"
  env = {
    MY_NAME = "Mona 2"
  }
  args = "\\"Hello world, I'm $MY_NAME!\\""
}

    `.trim(),
  }
}

export default HomePage
