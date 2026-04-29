import React from 'react'
import Card from '../components/Card';
import styled from 'styled-components';
import InventoryScreen from './InventoryScreen';
import { FiBox } from 'react-icons/fi';
import Button from '../components/Button';

const Icon = styled.div`
display: flex;
align-items: center;
gap: 10px;
  background: #fff2e8;
  padding: 12px;
  border-radius: 8px;
  font-size: 20px;
  color: #ff6a00;
`;

const Content = styled.div`
  flex: 1;
`;

const Title = styled.div`
color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
`;

const Info = styled.div`
  font-size: 13px;
  color: gray;
`;

const Details = styled.div`
  font-size: 13px;
  margin-top: 4px;
`;

const Status = styled.div`
  background: #d4f5e0;
  color: #1a7f37;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
`;
const Container = styled.div`
  padding: 30px;
`;

// const Title = styled.h2`
//   margin-bottom: 20px;
// `;

const SectionTitle = styled.h3`
  margin: 20px 0 12px;
`;

const SampleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 16px;
`;

const Footer = styled.div`
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 10px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

const Total = styled.div`
  font-size: 18px;

  span{
    margin-left: 10px;
    font-weight: bold;
    color: #ff6a00;
  }
`;

const Buttons = styled.div`
  gap: 10px;
`;

const DraftBtn = styled.button`
  padding: 10px 16px;
  border: 1px solid #ddd;
  background: white;
`;

const FinalizeBtn = styled.button`
  padding: 10px 16px;
  background: #ff6a00;
  color: white;
  border: none;
  border-radius: 6px;
`;
const Label = styled.div`
  color: gray;
`;

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

const SummaryScreen = ({ samples = [], inventoryItems = [], onBack, poQuantity }) => {
  const totalValue = inventoryItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
    0
  );
  console.log("samples", inventoryItems);
  return (
    <Container>

      <Title>Final QC Summary</Title>
      {poQuantity !== undefined && poQuantity !== "" && (
        <div style={{ marginTop: "10px", marginBottom: "20px", fontSize: "16px", fontWeight: "600" }}>
           Total Quantity of the PO: <span style={{ color: "#ff6a00" }}>{poQuantity}</span>
        </div>
      )}

      <SectionTitle>Sample Testing Summary</SectionTitle>

      {/* <SampleGrid>
        {samples.map((sample) => (
          <SampleSummaryCard
            key={sample.id}
            sample={sample}
          />

        ))}
      </SampleGrid> */}
      <Card>
      <Table>
                      <thead>
                          <tr>
                              <th>Sample</th>
                              <th>No of Item Tested</th>
                              <th>Item Names</th>
                              <th>Sample Quantity</th>
                              <th>Total Weight</th>
                              {/* <th>Action</th> */}
                          </tr>
                      </thead>
      
                      <tbody>
                          {/* {data.map((item, index) => (
                              <InventoryRow
                                  key={item.id}
                                  item={item}
                                  onChange={(field, value) =>
                                      updateField(index, field, value)
                                  }
                                  readOnly={readOnly}
                              />
                          ))} */}
                          {samples.map((sample) => {
                            const itemNames = sample.items.map((i) => i.item).join(", ");

                          return(
                            <tr>
                              <td>Sample {sample.id}</td>
                              <td style={{textAlign: "center"}}>{sample.items.length}</td>
                              <td>{itemNames}</td>
                              <td style={{textAlign: "center"}}>{sample.sampleQty}</td>
                              <td style={{textAlign: "center"}}>{sample.totalWeight}</td>
                            </tr>
                          )})}
                      </tbody>
                  </Table>
                  </Card>

      <SectionTitle>Inventory Summary</SectionTitle>

      <InventoryScreen
        items={inventoryItems}
        readOnly = {true}
      />

      <Footer>
        {/* <Total>
          Calculated Valuation
          <span>${totalValue.toLocaleString()}</span>
        </Total> */}

        <Buttons>
          {onBack && <Button variant='ghost' onClick={onBack}>← Back</Button>}
          {/* <Button variant='ghost'>Save Draft</Button> */}
          <Button variant='primary' style={{marginLeft: "1rem"}}>Finalize QC Report</Button>
        </Buttons>
      </Footer>

    </Container>
  )
}

export default SummaryScreen

export const SampleSummaryCard = ({ sample }) => {
  const itemNames = sample.items.map((i) => i.item).join(", ");

  console.log("sample", sample);

  return (
    <Card>
      <Icon>
        <FiBox /> <Title>Sample {sample.id}</Title>
      </Icon>

      <Content>

        <Info>
          {sample.items.length} items tested
        </Info>

        <Details>
          <Label>Items: {itemNames}</Label>
          <Label>Sample Qty: {sample.sampleQty}</Label>
          <Label>Total Weight: {sample.totalWeight} kg</Label>
        </Details>
      </Content>

      {/* <Status>Passed</Status> */}
    </Card>
  );
};