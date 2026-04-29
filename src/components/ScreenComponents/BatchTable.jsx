import styled from "styled-components";
import Card from "../Card";
import { useNavigate } from "react-router-dom";
import Button from "../Button";
import Badge from "../Badge";

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    padding: 12px;
    background: #f3f4f6;
  }

  td {
    padding: 12px;
    border-bottom: 1px solid #eee;
  }
`;

export const BatchTable = ({ data, setIsModalOpen, role }) => {
  const navigate = useNavigate();

  console.log("data", data)
  return (
    <Card hoverable={true}>
      <Table>
        <thead>
          <tr>
            <th>PO Ref Number</th>
            <th>Item Name</th>
            <th>Supplier</th>
            <th>Quantity</th>
            <th>QC Status</th>
            <th>Assigned QC</th>
            <th>Action</th>
            {/* <th>Action</th> */}
          </tr>
        </thead>
        <tbody>
          {data?.map((data) => {
            // const qc_done = data.qcDone !== 0
            const poItems = data?.po_items?.[0]
            const viewButton = data.total_allocated !== 0 ? true : false

            return (
              <tr>
                <td>{data.po_ref_number}</td>
                <td>{poItems?.po_item?.name}</td>
               <td>{data.supplier_name}</td>
               <td>{poItems?.quantity}</td>
                <td>{data.qc_allocation_status}</td>
                <td>{data.total_qc}/{data.total_allocated}</td>
                <td><Button onClick={viewButton ? () => navigate("/qc/view", { state: { batchData: data } }) : () => setIsModalOpen(true)}>
                  {viewButton ? "View" : "Assign"}
                </Button></td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </Card>
  )
}

export const TesterBatchTable = ({data}) => {
    const navigate = useNavigate();
    return(
        <Card hoverable={true}>
      <Table>
        <thead>
          <tr>
            <th>PO Ref Number</th>
            <th>Sample ID</th>
            <th>Assign Dated</th>
            <th>Planned Start Time</th>
            <th>Planned End Time</th>
            <th>QC Status</th>
            {/* <th>Assigned QC</th> */}
            <th>Action</th>
            {/* <th>Action</th> */}
          </tr>
        </thead>
        <tbody>
          {data?.map((data) => {
          
            const qc_status = data.qc_status === "P" ? "In progress" : "Not Started"
            return (
              <tr>
                <td>{data.po_ref_number}</td>
                <td>{data.sample_id}</td>
                <td>{data.qc_date}</td>
                <td>{data.scheduled_start}</td>
                <td>{data.scheduled_end}</td>
                <td><Badge variant={data.qc_status === "P" ? "info" : "notPlanned"}>{qc_status}</Badge></td>
                 <td>
                    {/* start qc button code did not their */}
                  <Button onClick={() =>{data.qc_status === "P"? navigate("/qc/sampleTestScreen", { state: { batchData: data } }) : console.log("click on start qc button")}}>
                    {data.qc_status === "P" ? "View" : "Start Qc"}
                  </Button></td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </Card> 
    )
}