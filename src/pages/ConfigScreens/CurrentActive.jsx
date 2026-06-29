import React from "react";
import Layout from "../../components/Layout";
import BatchScreen from "../Production Module/BatchScreen";
const CurrentActive = () => {
  return (
    <Layout title="Current Active Batches">
      <BatchScreen hideActionButtons={true} />
    </Layout>
  );
};

export default CurrentActive;