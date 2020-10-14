/*const DEFAULT_CONTEXT = {
    isPublicProfile: false,

  };
  
  const SingleSubmissionContext = createContext(DEFAULT_CONTEXT);*/
  import React from 'react'

const SingleSubmissionContext = React.createContext()

export const SingleSubmissionProvider = SingleSubmissionContext.Provider;
export const SingleSubmissionConsumer = SingleSubmissionContext.Consumer;

export default SingleSubmissionContext;